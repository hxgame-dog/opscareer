import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireCurrentUser } from '@/lib/auth-session';
import { prisma } from '@/lib/db';
import { generateGeminiJson } from '@/lib/gemini';
import { buildFallbackMockInterviewSummary } from '@/lib/mock-interview';
import { toMockInterviewDetail } from '@/lib/mock-interview-payload';
import { buildMockInterviewSummaryPrompt } from '@/lib/prompt-templates/mock-interview-summary';
import { requireGeminiCredentials } from '@/lib/repositories';
import { fail, ok } from '@/lib/response';
import { hashPrompt, sanitizePromptInput } from '@/lib/security';
import { MockInterviewSummary } from '@/types/domain';

const SummarySchema = z.object({
  overallScore: z.number().int().min(0).max(100),
  dimensionScores: z.object({
    relevance: z.number().int().min(0).max(100),
    technicalDepth: z.number().int().min(0).max(100),
    structure: z.number().int().min(0).max(100),
    jobFit: z.number().int().min(0).max(100),
    evidence: z.number().int().min(0).max(100)
  }),
  performanceLevel: z.string(),
  topStrengths: z.array(z.string()),
  topRisks: z.array(z.string()),
  recommendedTopics: z.array(z.string())
});

export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireCurrentUser();
    const { apiKey, model } = await requireGeminiCredentials(user.id);

    const session = await prisma.mockInterviewSession.findUnique({
      where: { id },
      include: {
        jobPosting: true,
        questions: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            order: true,
            category: true,
            question: true,
            intent: true,
            difficulty: true
          }
        },
        turns: {
          orderBy: { answeredAt: 'asc' },
          select: {
            id: true,
            questionId: true,
            audioMimeType: true,
            audioDurationSec: true,
            transcript: true,
            feedbackJson: true,
            answeredAt: true
          }
        }
      }
    });

    if (!session || session.userId !== user.id) {
      return fail('Mock interview session not found.', 404);
    }

    const evaluatedTurns = session.turns
      .map((turn) => ({
        ...turn,
        evaluation: turn.feedbackJson ? JSON.parse(turn.feedbackJson) : null
      }))
      .filter((turn) => turn.evaluation);

    if (evaluatedTurns.length === 0) {
      return fail('At least one answered question is required to complete the session.', 400);
    }

    const turnsPayload = JSON.stringify(
      evaluatedTurns.map((turn) => ({
        question: session.questions.find((question) => question.id === turn.questionId)?.question ?? '',
        transcript: turn.transcript,
        evaluation: turn.evaluation
      }))
    );
    const prompt = buildMockInterviewSummaryPrompt({
      jdText: sanitizePromptInput(session.jobPosting.description),
      language: session.language as 'zh-CN' | 'en-US',
      targetLevel: sanitizePromptInput(session.targetLevel),
      turnsJson: sanitizePromptInput(turnsPayload)
    });

    let summary: MockInterviewSummary;
    let rawText = '';
    let latencyMs = 0;
    try {
      const generated = await generateGeminiJson<MockInterviewSummary>({ apiKey, model, prompt });
      summary = SummarySchema.parse(generated.data);
      rawText = generated.rawText;
      latencyMs = generated.latencyMs;
    } catch {
      summary = buildFallbackMockInterviewSummary(evaluatedTurns.map((turn) => turn.evaluation!));
      rawText = JSON.stringify(summary);
      latencyMs = 0;
    }

    const updated = await prisma.mockInterviewSession.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        overallScore: summary.overallScore,
        dimensionScoresJson: JSON.stringify(summary.dimensionScores),
        summaryJson: JSON.stringify(summary),
        completedAt: new Date()
      },
      include: {
        jobPosting: {
          select: {
            company: true,
            role: true
          }
        },
        questions: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            order: true,
            category: true,
            question: true,
            intent: true,
            difficulty: true
          }
        },
        turns: {
          orderBy: { answeredAt: 'asc' },
          select: {
            id: true,
            questionId: true,
            audioMimeType: true,
            audioDurationSec: true,
            transcript: true,
            feedbackJson: true,
            answeredAt: true
          }
        }
      }
    });

    await prisma.generationRun.create({
      data: {
        userId: user.id,
        taskType: 'mock_interview.summary',
        model,
        promptHash: hashPrompt(prompt),
        inputSnapshot: JSON.stringify({ sessionId: id, answeredCount: evaluatedTurns.length }),
        outputJson: rawText,
        latencyMs
      }
    });

    return ok(toMockInterviewDetail(updated));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return fail(message, message === 'Authentication required.' ? 401 : 400);
  }
}

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireCurrentUser } from '@/lib/auth-session';
import { prisma } from '@/lib/db';
import { generateGeminiJson, transcribeGeminiAudio } from '@/lib/gemini';
import { buildMockInterviewEvaluatePrompt } from '@/lib/prompt-templates/mock-interview-evaluate';
import { buildMockInterviewTranscribePrompt } from '@/lib/prompt-templates/mock-interview-transcribe';
import { requireGeminiCredentials } from '@/lib/repositories';
import { fail, ok } from '@/lib/response';
import { hashPrompt, sanitizePromptInput } from '@/lib/security';
import { MockInterviewEvaluation } from '@/types/domain';

const BodySchema = z.object({
  questionId: z.string(),
  audioBase64: z.string().min(1).max(12_000_000).optional(),
  mimeType: z.string().regex(/^audio\//).optional(),
  durationSec: z.number().int().min(1).max(900).optional(),
  retryEvaluation: z.boolean().optional()
});

const EvaluationSchema = z.object({
  score: z.number().int().min(0).max(100),
  dimensionScores: z.object({
    relevance: z.number().int().min(0).max(100),
    technicalDepth: z.number().int().min(0).max(100),
    structure: z.number().int().min(0).max(100),
    jobFit: z.number().int().min(0).max(100),
    evidence: z.number().int().min(0).max(100)
  }),
  strengths: z.array(z.string()),
  gaps: z.array(z.string()),
  improvedAnswer: z.string(),
  followUpAdvice: z.string()
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = BodySchema.parse(await req.json());
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

    const question = session.questions.find((item) => item.id === body.questionId);
    if (!question) {
      return fail('Mock interview question not found.', 404);
    }

    let transcript = '';
    let rawTranscript = '';
    let transcriptLatency = 0;

    const existingTurn = session.turns.find((turn) => turn.questionId === question.id);
    if (body.retryEvaluation) {
      if (!existingTurn?.transcript) {
        return fail('No transcript available for retry evaluation.', 400);
      }
      transcript = existingTurn.transcript;
    } else {
      if (!body.audioBase64 || !body.mimeType) {
        return fail('audioBase64 and mimeType are required.', 400);
      }
      const transcriptPrompt = buildMockInterviewTranscribePrompt(session.language as 'zh-CN' | 'en-US');
      const transcribed = await transcribeGeminiAudio({
        apiKey,
        model,
        prompt: transcriptPrompt,
        mimeType: body.mimeType,
        base64Data: body.audioBase64
      });
      transcript = transcribed.text.trim();
      rawTranscript = transcribed.text;
      transcriptLatency = transcribed.latencyMs;

      await prisma.generationRun.create({
        data: {
          userId: user.id,
          taskType: 'mock_interview.transcribe',
          model,
          promptHash: hashPrompt(transcriptPrompt),
          inputSnapshot: JSON.stringify({
            sessionId: id,
            questionId: question.id,
            mimeType: body.mimeType,
            durationSec: body.durationSec ?? null
          }),
          outputJson: rawTranscript,
          latencyMs: transcriptLatency
        }
      });
    }

    if (!transcript) {
      return fail('Transcript is empty after processing.', 400);
    }

    const persistedTurn = await prisma.mockInterviewTurn.upsert({
      where: {
        sessionId_questionId: {
          sessionId: id,
          questionId: question.id
        }
      },
      update: {
        audioMimeType: body.mimeType ?? existingTurn?.audioMimeType ?? 'audio/webm',
        audioDurationSec: body.durationSec ?? existingTurn?.audioDurationSec ?? null,
        transcript
      },
      create: {
        userId: user.id,
        sessionId: id,
        questionId: question.id,
        audioMimeType: body.mimeType ?? 'audio/webm',
        audioDurationSec: body.durationSec ?? null,
        transcript
      }
    });

    const evalPrompt = buildMockInterviewEvaluatePrompt({
      jdText: sanitizePromptInput(session.jobPosting.description),
      language: session.language as 'zh-CN' | 'en-US',
      question,
      transcript: sanitizePromptInput(transcript)
    });

    let evaluation: MockInterviewEvaluation;
    let rawEvaluation = '';
    let evaluationLatency = 0;

    try {
      const generated = await generateGeminiJson<MockInterviewEvaluation>({
        apiKey,
        model,
        prompt: evalPrompt
      });
      evaluation = EvaluationSchema.parse(generated.data);
      rawEvaluation = generated.rawText;
      evaluationLatency = generated.latencyMs;
    } catch (error) {
      return fail(`Evaluation failed after transcript was saved. ${(error as Error).message}`, 502);
    }

    const updatedTurn = await prisma.mockInterviewTurn.update({
      where: { id: persistedTurn.id },
      data: {
        score: evaluation.score,
        dimensionScoresJson: JSON.stringify(evaluation.dimensionScores),
        feedbackJson: JSON.stringify(evaluation)
      }
    });

    await prisma.generationRun.create({
      data: {
        userId: user.id,
        taskType: 'mock_interview.evaluate',
        model,
        promptHash: hashPrompt(evalPrompt),
        inputSnapshot: JSON.stringify({
          sessionId: id,
          questionId: question.id,
          transcript
        }),
        outputJson: rawEvaluation,
        latencyMs: evaluationLatency
      }
    });

    const answeredIds = new Set(
      [
        ...session.turns.filter((turn) => turn.feedbackJson).map((turn) => turn.questionId),
        updatedTurn.questionId
      ].filter(Boolean)
    );
    const nextQuestion = session.questions.find((item) => !answeredIds.has(item.id)) ?? null;
    const completed = !nextQuestion && session.questions.length > 0;

    if (session.status === 'DRAFT') {
      await prisma.mockInterviewSession.update({
        where: { id },
        data: {
          status: 'IN_PROGRESS',
          startedAt: session.startedAt ?? new Date()
        }
      });
    }

    return ok({
      transcript,
      evaluation,
      nextQuestion,
      completed
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return fail(message, message === 'Authentication required.' ? 401 : 400);
  }
}

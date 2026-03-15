import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireCurrentUser } from '@/lib/auth-session';
import { prisma } from '@/lib/db';
import { generateGeminiJson } from '@/lib/gemini';
import { buildInterviewSummaryPrompt } from '@/lib/prompt-templates/interview-summary';
import { requireGeminiCredentials } from '@/lib/repositories';
import { fail, ok } from '@/lib/response';
import { hashPrompt } from '@/lib/security';

const BodySchema = z.object({
  feedback: z.string().optional()
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const body = BodySchema.parse(await req.json());
    const { id } = await params;
    const user = await requireCurrentUser();
    const { apiKey, model } = await requireGeminiCredentials(user.id);

    const interview = await prisma.interviewRecord.findUnique({
      where: { id },
      include: { jobPosting: true }
    });

    if (!interview || interview.userId !== user.id) {
      return fail('Interview not found.', 404);
    }

    const prompt = buildInterviewSummaryPrompt({
      company: interview.jobPosting.company,
      role: interview.jobPosting.role,
      jdText: interview.jobPosting.description,
      roundName: interview.roundName,
      notes: interview.notes,
      feedback: body.feedback ?? interview.feedback ?? undefined
    });

    const generated = await generateGeminiJson<{ summary: string }>({ apiKey, model, prompt });

    const updated = await prisma.interviewRecord.update({
      where: { id },
      data: {
        summary: generated.data.summary,
        feedback: body.feedback ?? interview.feedback
      },
      include: { jobPosting: true }
    });

    await prisma.generationRun.create({
      data: {
        userId: user.id,
        taskType: 'interview.summary',
        model,
        promptHash: hashPrompt(prompt),
        inputSnapshot: JSON.stringify({ interviewId: id, feedback: body.feedback }),
        outputJson: generated.rawText,
        latencyMs: generated.latencyMs
      }
    });

    return ok(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return fail(message, message === 'Authentication required.' ? 401 : 400);
  }
}

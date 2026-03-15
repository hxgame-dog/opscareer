import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireCurrentUser } from '@/lib/auth-session';
import { prisma } from '@/lib/db';
import { generateGeminiJson } from '@/lib/gemini';
import { buildInterviewPreparePrompt } from '@/lib/prompt-templates/interview-prepare';
import { requireGeminiCredentials } from '@/lib/repositories';
import { fail, ok } from '@/lib/response';
import { hashPrompt, sanitizePromptInput } from '@/lib/security';
import { InterviewPrepResult, Language } from '@/types/domain';

const BodySchema = z.object({
  jobPostingId: z.string().optional(),
  jd: z.object({
    company: z.string(),
    role: z.string(),
    description: z.string(),
    language: z.enum(['zh-CN', 'en-US']).optional()
  }),
  targetLevel: z.string().default('mid')
});

export async function POST(req: NextRequest) {
  try {
    const body = BodySchema.parse(await req.json());
    const user = await requireCurrentUser();
    const { apiKey, model } = await requireGeminiCredentials(user.id);
    const language = (body.jd.language ?? 'zh-CN') as Language;

    let jobPostingId = body.jobPostingId;
    if (jobPostingId) {
      const existing = await prisma.jobPosting.findUnique({ where: { id: jobPostingId } });
      if (!existing || existing.userId !== user.id) {
        return fail('Job posting not found for this account.', 404);
      }
    } else {
      const posting = await prisma.jobPosting.create({
        data: {
          userId: user.id,
          company: body.jd.company,
          role: body.jd.role,
          description: body.jd.description,
          language,
          source: 'INTERVIEW_PREP',
          saved: false,
          parsedJson: JSON.stringify({ role: body.jd.role }),
          keywordsJson: JSON.stringify([])
        }
      });
      jobPostingId = posting.id;
    }

    const prompt = buildInterviewPreparePrompt(
      sanitizePromptInput(body.jd.description),
      sanitizePromptInput(body.targetLevel),
      language
    );
    const generated = await generateGeminiJson<InterviewPrepResult>({ apiKey, model, prompt });

    const prep = await prisma.interviewPrep.create({
      data: {
        userId: user.id,
        jobPostingId,
        targetLevel: body.targetLevel,
        strategy: generated.data.strategy,
        questionsJson: JSON.stringify(generated.data.qa)
      }
    });

    await prisma.generationRun.create({
      data: {
        userId: user.id,
        taskType: 'interview.prepare',
        model,
        promptHash: hashPrompt(prompt),
        inputSnapshot: JSON.stringify(body),
        outputJson: generated.rawText,
        latencyMs: generated.latencyMs
      }
    });

    return ok({
      prepId: prep.id,
      jobPostingId,
      strategy: generated.data.strategy,
      qa: generated.data.qa
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return fail(message, message === 'Authentication required.' ? 401 : 400);
  }
}

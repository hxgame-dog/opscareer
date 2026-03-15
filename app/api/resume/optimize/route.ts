import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireCurrentUser } from '@/lib/auth-session';
import { prisma } from '@/lib/db';
import { generateGeminiJson } from '@/lib/gemini';
import { resumeToMarkdown } from '@/lib/markdown';
import { buildResumeOptimizePrompt } from '@/lib/prompt-templates/resume-optimize';
import { requireGeminiCredentials } from '@/lib/repositories';
import { fail, ok } from '@/lib/response';
import { hashPrompt, sanitizePromptInput } from '@/lib/security';
import { Language, ResumeDiagnosisReport, ResumeDraft, ResumeTheme } from '@/types/domain';

const BodySchema = z.object({
  resumeId: z.string().optional(),
  resumeMarkdown: z.string().optional(),
  jd: z.object({
    company: z.string(),
    role: z.string(),
    description: z.string(),
    language: z.enum(['zh-CN', 'en-US']).optional()
  }),
  theme: z.enum(['CLASSIC', 'EXECUTIVE', 'MODERN']).optional()
});

type OptimizeResult = {
  optimizedResume: ResumeDraft;
  diagnosis: ResumeDiagnosisReport;
  keywords: string[];
};

export async function POST(req: NextRequest) {
  try {
    const body = BodySchema.parse(await req.json());
    const user = await requireCurrentUser();
    const { apiKey, model } = await requireGeminiCredentials(user.id);

    let baseMarkdown = body.resumeMarkdown;
    let baseResumeId: string | null = null;
    let baseProfileId: string | null = null;
    let currentVersion = 0;
    let theme: ResumeTheme = 'CLASSIC';
    let language: Language = (body.jd.language ?? 'zh-CN') as Language;

    if (body.resumeId) {
      const resume = await prisma.resume.findUnique({ where: { id: body.resumeId } });
      if (!resume) {
        return fail('Resume not found for provided resumeId.', 404);
      }
      if (resume.userId !== user.id) {
        return fail('Resume not found for this account.', 404);
      }
      baseMarkdown = resume.markdown;
      baseResumeId = resume.id;
      baseProfileId = resume.profileId;
      currentVersion = resume.version;
      theme = resume.theme as ResumeTheme;
      language = resume.language as Language;
    }

    if (!baseMarkdown) {
      return fail('resumeMarkdown or resumeId is required.');
    }

    const safeJd = sanitizePromptInput(body.jd.description);
    language = (body.jd.language as Language | undefined) ?? language;
    const prompt = buildResumeOptimizePrompt(baseMarkdown, safeJd, language);
    const generated = await generateGeminiJson<OptimizeResult>({ apiKey, model, prompt });
    theme = (body.theme as ResumeTheme | undefined) ?? theme;

    const jobPosting = await prisma.jobPosting.create({
      data: {
        userId: user.id,
        company: body.jd.company,
        role: body.jd.role,
        description: body.jd.description,
        language,
        source: 'RESUME_OPTIMIZE',
        saved: false,
        parsedJson: JSON.stringify({ role: body.jd.role }),
        keywordsJson: JSON.stringify(generated.data.keywords ?? [])
      }
    });

    const optimizedResume = await prisma.resume.create({
      data: {
        userId: user.id,
        profileId: baseProfileId,
        jobPostingId: jobPosting.id,
        parentResumeId: baseResumeId,
        title: `${body.jd.company}-${body.jd.role}-optimized`,
        contentJson: JSON.stringify(generated.data.optimizedResume),
        markdown: resumeToMarkdown(generated.data.optimizedResume, theme),
        language,
        version: currentVersion + 1,
        theme
      }
    });

    await prisma.resumeDiagnosis.create({
      data: {
        userId: user.id,
        resumeId: optimizedResume.id,
        jobPostingId: jobPosting.id,
        score: generated.data.diagnosis.score,
        strengthsJson: JSON.stringify(generated.data.diagnosis.strengths),
        gapsJson: JSON.stringify(generated.data.diagnosis.gaps),
        suggestionsJson: JSON.stringify(generated.data.diagnosis.suggestions),
        riskFlagsJson: JSON.stringify(generated.data.diagnosis.riskFlags)
      }
    });

    await prisma.generationRun.create({
      data: {
        userId: user.id,
        taskType: 'resume.optimize',
        model,
        promptHash: hashPrompt(prompt),
        inputSnapshot: JSON.stringify({
          baseResumeId,
          baseMarkdown,
          jd: body.jd,
          theme
        }),
        outputJson: generated.rawText,
        latencyMs: generated.latencyMs
      }
    });

    return ok({
      resumeId: optimizedResume.id,
      jobPostingId: jobPosting.id,
      optimizedResume: generated.data.optimizedResume,
      markdown: optimizedResume.markdown,
      theme,
      diagnosis: generated.data.diagnosis
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return fail(message, message === 'Authentication required.' ? 401 : 400);
  }
}

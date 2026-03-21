import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireCurrentUser } from '@/lib/auth-session';
import { prisma } from '@/lib/db';
import { generateGeminiJson } from '@/lib/gemini';
import { resumeToMarkdown } from '@/lib/markdown';
import { buildResumeGeneratePrompt } from '@/lib/prompt-templates/resume-generate';
import { requireGeminiCredentials } from '@/lib/repositories';
import { fail, ok } from '@/lib/response';
import { hashPrompt, sanitizePromptInput } from '@/lib/security';
import { Language, ProfileInput, ResumeDraft, ResumeTheme } from '@/types/domain';

const ProfileSchema = z.object({
  basics: z.object({
    name: z.string(),
    email: z.string().email(),
    phone: z.string().optional(),
    location: z.string().optional(),
    summary: z.string(),
    yearsOfExperience: z.number().optional()
  }),
  experiences: z.array(
    z.object({
      company: z.string(),
      role: z.string(),
      start: z.string(),
      end: z.string().optional(),
      achievements: z.array(z.string()),
      techStack: z.array(z.string()).optional()
    })
  ),
  projects: z.array(
    z.object({
      name: z.string(),
      role: z.string().optional(),
      summary: z.string(),
      highlights: z.array(z.string())
    })
  ),
  skills: z.array(z.string()),
  education: z.array(
    z.object({
      school: z.string(),
      degree: z.string(),
      major: z.string().optional(),
      start: z.string().optional(),
      end: z.string().optional()
    })
  ),
  language: z.enum(['zh-CN', 'en-US']).optional()
});

const BodySchema = z.object({
  profile: ProfileSchema,
  style: z.string().default('professional'),
  title: z.string().optional(),
  theme: z.enum(['CLASSIC', 'EXECUTIVE', 'MODERN']).default('CLASSIC'),
  context: z
    .object({
      identity: z.string().optional(),
      targetRole: z.string().optional()
    })
    .optional()
});

export async function POST(req: NextRequest) {
  try {
    const body = BodySchema.parse(await req.json());
    const user = await requireCurrentUser();
    const { apiKey, model } = await requireGeminiCredentials(user.id);

    const profile = body.profile as ProfileInput;
    const language = (profile.language ?? 'zh-CN') as Language;
    const safeProfile = JSON.parse(sanitizePromptInput(JSON.stringify(profile)));
    const prompt = buildResumeGeneratePrompt(safeProfile, body.style, language, body.context);
    const generated = await generateGeminiJson<ResumeDraft>({ apiKey, model, prompt });
    const theme = body.theme as ResumeTheme;
    const markdown = resumeToMarkdown(generated.data, theme);

    const profileRow = await prisma.profile.create({
      data: {
        userId: user.id,
        title: body.title ?? `${profile.basics.name}-Profile`,
        basicsJson: JSON.stringify(profile.basics),
        experienceJson: JSON.stringify(profile.experiences),
        projectsJson: JSON.stringify(profile.projects),
        skillsJson: JSON.stringify(profile.skills),
        educationJson: JSON.stringify(profile.education),
        language
      }
    });

    const resumeRow = await prisma.resume.create({
      data: {
        userId: user.id,
        profileId: profileRow.id,
        title: body.title ?? `${profile.basics.name}-Resume-v1`,
        parentResumeId: null,
        contentJson: JSON.stringify(generated.data),
        markdown,
        language,
        theme
      }
    });

    await prisma.generationRun.create({
      data: {
        userId: user.id,
        taskType: 'resume.generate',
        model,
        promptHash: hashPrompt(prompt),
        inputSnapshot: JSON.stringify({ profile, style: body.style, theme, context: body.context ?? null }),
        outputJson: generated.rawText,
        latencyMs: generated.latencyMs
      }
    });

    return ok({
      resumeId: resumeRow.id,
      profileId: profileRow.id,
      draft: generated.data,
      markdown,
      theme
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return fail(message, message === 'Authentication required.' ? 401 : 400);
  }
}

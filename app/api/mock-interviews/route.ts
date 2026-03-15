import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireCurrentUser } from '@/lib/auth-session';
import { prisma } from '@/lib/db';
import { generateGeminiJson } from '@/lib/gemini';
import { toMockInterviewListItem } from '@/lib/mock-interview-payload';
import { buildMockInterviewGeneratePrompt } from '@/lib/prompt-templates/mock-interview-generate';
import { requireGeminiCredentials } from '@/lib/repositories';
import { fail, ok } from '@/lib/response';
import { hashPrompt, sanitizePromptInput } from '@/lib/security';
import { Language, MockInterviewQuestion } from '@/types/domain';

const QuerySchema = z.object({
  status: z.enum(['DRAFT', 'IN_PROGRESS', 'COMPLETED', 'ABANDONED']).optional(),
  q: z.string().optional()
});

const CreateSchema = z.object({
  jobPostingId: z.string().optional(),
  jd: z
    .object({
      company: z.string(),
      role: z.string(),
      description: z.string(),
      language: z.enum(['zh-CN', 'en-US']).optional()
    })
    .optional(),
  targetLevel: z.string().default('senior'),
  language: z.enum(['zh-CN', 'en-US']).default('zh-CN'),
  questionCount: z.union([z.literal(3), z.literal(5), z.literal(8)]).default(5)
});

const GeneratedQuestionsSchema = z.object({
  questions: z.array(
    z.object({
      order: z.number().int().positive(),
      category: z.enum(['EXPERIENCE', 'PROJECT', 'TECHNICAL', 'SCENARIO', 'COMMUNICATION']),
      question: z.string(),
      intent: z.string(),
      difficulty: z.string()
    })
  )
});

export async function GET(req: NextRequest) {
  try {
    const user = await requireCurrentUser();
    const query = QuerySchema.parse({
      status: req.nextUrl.searchParams.get('status') ?? undefined,
      q: req.nextUrl.searchParams.get('q') ?? undefined
    });

    const sessions = await prisma.mockInterviewSession.findMany({
      where: {
        userId: user.id,
        ...(query.status ? { status: query.status } : {}),
        ...(query.q
          ? {
              jobPosting: {
                OR: [{ company: { contains: query.q } }, { role: { contains: query.q } }, { description: { contains: query.q } }]
              }
            }
          : {})
      },
      include: {
        jobPosting: { select: { company: true, role: true } },
        turns: { select: { id: true } }
      },
      orderBy: { updatedAt: 'desc' }
    });

    return ok({ items: sessions.map(toMockInterviewListItem) });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return fail(message, message === 'Authentication required.' ? 401 : 400);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = CreateSchema.parse(await req.json());
    const user = await requireCurrentUser();
    const { apiKey, model } = await requireGeminiCredentials(user.id);

    let jobPostingId = body.jobPostingId;
    let jobPostingLanguage: Language = body.language;
    let jdText = '';
    let company = '';
    let role = '';

    if (jobPostingId) {
      const existing = await prisma.jobPosting.findUnique({ where: { id: jobPostingId } });
      if (!existing || existing.userId !== user.id) {
        return fail('Job posting not found for this account.', 404);
      }
      company = existing.company;
      role = existing.role;
      jdText = existing.description;
      jobPostingLanguage = existing.language as Language;
    } else {
      if (!body.jd) {
        return fail('jobPostingId or jd is required.');
      }
      company = body.jd.company;
      role = body.jd.role;
      jdText = body.jd.description;
      jobPostingLanguage = (body.jd.language ?? body.language) as Language;
      const posting = await prisma.jobPosting.create({
        data: {
          userId: user.id,
          company,
          role,
          description: jdText,
          language: jobPostingLanguage,
          source: 'INTERVIEW_PREP',
          saved: false,
          parsedJson: JSON.stringify({ role }),
          keywordsJson: JSON.stringify([])
        }
      });
      jobPostingId = posting.id;
    }

    const prompt = buildMockInterviewGeneratePrompt(
      sanitizePromptInput(jdText),
      sanitizePromptInput(body.targetLevel),
      body.questionCount,
      jobPostingLanguage
    );
    const generated = await generateGeminiJson<{ questions: MockInterviewQuestion[] }>({ apiKey, model, prompt });
    const parsed = GeneratedQuestionsSchema.parse(generated.data);
    const questions = parsed.questions
      .sort((a, b) => a.order - b.order)
      .slice(0, body.questionCount)
      .map((item, index) => ({
        ...item,
        order: index + 1
      }));

    const session = await prisma.mockInterviewSession.create({
      data: {
        userId: user.id,
        jobPostingId,
        status: 'IN_PROGRESS',
        language: jobPostingLanguage,
        targetLevel: body.targetLevel,
        questionCount: questions.length,
        startedAt: new Date(),
        questions: {
          create: questions.map((question) => ({
            order: question.order,
            category: question.category,
            question: question.question,
            intent: question.intent,
            difficulty: question.difficulty
          }))
        }
      },
      include: {
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
        }
      }
    });

    await prisma.generationRun.create({
      data: {
        userId: user.id,
        taskType: 'mock_interview.generate',
        model,
        promptHash: hashPrompt(prompt),
        inputSnapshot: JSON.stringify({
          jobPostingId,
          company,
          role,
          targetLevel: body.targetLevel,
          language: jobPostingLanguage,
          questionCount: body.questionCount
        }),
        outputJson: generated.rawText,
        latencyMs: generated.latencyMs
      }
    });

    return ok({
      sessionId: session.id,
      questions: session.questions,
      currentQuestion: session.questions[0] ?? null
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return fail(message, message === 'Authentication required.' ? 401 : 400);
  }
}

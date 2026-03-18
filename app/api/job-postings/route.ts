import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireCurrentUser } from '@/lib/auth-session';
import { prisma } from '@/lib/db';
import { toUserErrorMessage } from '@/lib/errors';
import { fail, ok } from '@/lib/response';

const CreateSchema = z.object({
  company: z.string().min(1),
  role: z.string().min(1),
  description: z.string().min(1),
  language: z.enum(['zh-CN', 'en-US']).default('zh-CN'),
  saved: z.boolean().default(true)
});

const QuerySchema = z.object({
  q: z.string().optional(),
  savedOnly: z.enum(['true', 'false']).optional(),
  source: z.enum(['MANUAL', 'RESUME_OPTIMIZE', 'INTERVIEW_PREP']).optional()
});

export async function GET(req: NextRequest) {
  try {
    const user = await requireCurrentUser();
    const query = QuerySchema.parse({
      q: req.nextUrl.searchParams.get('q') ?? undefined,
      savedOnly: req.nextUrl.searchParams.get('savedOnly') ?? undefined,
      source: req.nextUrl.searchParams.get('source') ?? undefined
    });

    const jobPostings = await prisma.jobPosting.findMany({
      where: {
        userId: user.id,
        ...(query.savedOnly === 'true' ? { saved: true } : {}),
        ...(query.source ? { source: query.source } : {}),
        ...(query.q
          ? {
              OR: [
                { company: { contains: query.q } },
                { role: { contains: query.q } },
                { description: { contains: query.q } }
              ]
            }
          : {})
      },
      orderBy: { updatedAt: 'desc' }
    });

    return ok(jobPostings);
  } catch (error) {
    const message = toUserErrorMessage(error);
    return fail(message, message === 'Authentication required.' ? 401 : 400);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireCurrentUser();
    const body = CreateSchema.parse(await req.json());

    const created = await prisma.jobPosting.create({
      data: {
        userId: user.id,
        company: body.company,
        role: body.role,
        description: body.description,
        language: body.language,
        source: 'MANUAL',
        saved: body.saved,
        parsedJson: JSON.stringify({ role: body.role }),
        keywordsJson: JSON.stringify([])
      }
    });

    return ok(created, 201);
  } catch (error) {
    const message = toUserErrorMessage(error);
    return fail(message, message === 'Authentication required.' ? 401 : 400);
  }
}

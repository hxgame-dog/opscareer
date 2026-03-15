import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireCurrentUser } from '@/lib/auth-session';
import { groupApplicationsForBoard } from '@/lib/applications';
import { prisma } from '@/lib/db';
import { fail, ok } from '@/lib/response';
import { ApplicationCard } from '@/types/domain';

const QuerySchema = z.object({
  view: z.enum(['board', 'list']).optional(),
  status: z
    .enum(['SAVED', 'READY', 'APPLIED', 'SCREENING', 'INTERVIEWING', 'OFFER', 'REJECTED', 'WITHDRAWN'])
    .optional(),
  company: z.string().optional(),
  role: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  q: z.string().optional()
});

const CreateSchema = z.object({
  jobPostingId: z.string(),
  resumeId: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  notes: z.string().optional(),
  source: z.string().optional(),
  status: z
    .enum(['SAVED', 'READY', 'APPLIED', 'SCREENING', 'INTERVIEWING', 'OFFER', 'REJECTED', 'WITHDRAWN'])
    .optional()
});

function toApplicationCard(item: {
  id: string;
  status: 'SAVED' | 'READY' | 'APPLIED' | 'SCREENING' | 'INTERVIEWING' | 'OFFER' | 'REJECTED' | 'WITHDRAWN';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  notes: string;
  source: string | null;
  appliedAt: Date | null;
  updatedAt: Date;
  jobPosting: { company: string; role: string };
  resume: { version: number; theme: string } | null;
  interviews: Array<{ id: string }>;
}): ApplicationCard {
  return {
    id: item.id,
    status: item.status,
    priority: item.priority,
    notes: item.notes,
    source: item.source,
    appliedAt: item.appliedAt?.toISOString() ?? null,
    updatedAt: item.updatedAt.toISOString(),
    company: item.jobPosting.company,
    role: item.jobPosting.role,
    resumeLabel: item.resume ? `V${item.resume.version} / ${item.resume.theme}` : null,
    interviewCount: item.interviews.length
  };
}

export async function GET(req: NextRequest) {
  try {
    const user = await requireCurrentUser();
    const query = QuerySchema.parse({
      view: req.nextUrl.searchParams.get('view') ?? undefined,
      status: req.nextUrl.searchParams.get('status') ?? undefined,
      company: req.nextUrl.searchParams.get('company') ?? undefined,
      role: req.nextUrl.searchParams.get('role') ?? undefined,
      priority: req.nextUrl.searchParams.get('priority') ?? undefined,
      q: req.nextUrl.searchParams.get('q') ?? undefined
    });

    const legacyInterviews = await prisma.interviewRecord.findMany({
      where: {
        userId: user.id,
        applicationId: null
      },
      select: {
        id: true,
        jobPostingId: true,
        status: true
      }
    });

    for (const interview of legacyInterviews) {
      let application = await prisma.application.findFirst({
        where: {
          userId: user.id,
          jobPostingId: interview.jobPostingId
        },
        orderBy: { updatedAt: 'desc' }
      });

      if (!application) {
        application = await prisma.application.create({
          data: {
            userId: user.id,
            jobPostingId: interview.jobPostingId,
            status:
              interview.status === 'OFFER'
                ? 'OFFER'
                : interview.status === 'REJECTED'
                  ? 'REJECTED'
                  : 'INTERVIEWING',
            priority: 'MEDIUM'
          }
        });
      }

      await prisma.interviewRecord.update({
        where: { id: interview.id },
        data: {
          applicationId: application.id
        }
      });
    }

    const applications = await prisma.application.findMany({
      where: {
        userId: user.id,
        ...(query.status ? { status: query.status } : {}),
        ...(query.priority ? { priority: query.priority } : {}),
        ...(query.company || query.role || query.q
          ? {
              jobPosting: {
                ...(query.company ? { company: { contains: query.company } } : {}),
                ...(query.role ? { role: { contains: query.role } } : {}),
                ...(query.q
                  ? {
                      OR: [
                        { company: { contains: query.q } },
                        { role: { contains: query.q } },
                        { description: { contains: query.q } }
                      ]
                    }
                  : {})
              }
            }
          : {})
      },
      include: {
        jobPosting: {
          select: {
            company: true,
            role: true
          }
        },
        resume: {
          select: {
            version: true,
            theme: true
          }
        },
        interviews: {
          select: {
            id: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    const items = applications.map(toApplicationCard);
    if (query.view === 'board') {
      return ok({ columns: groupApplicationsForBoard(items) });
    }

    return ok({ items });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return fail(message, message === 'Authentication required.' ? 401 : 400);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireCurrentUser();
    const body = CreateSchema.parse(await req.json());
    const jobPosting = await prisma.jobPosting.findUnique({ where: { id: body.jobPostingId } });
    if (!jobPosting || jobPosting.userId !== user.id) {
      return fail('Job posting not found for this account.', 404);
    }

    if (body.resumeId) {
      const resume = await prisma.resume.findUnique({ where: { id: body.resumeId } });
      if (!resume || resume.userId !== user.id) {
        return fail('Resume not found for this account.', 404);
      }
    }

    const created = await prisma.application.create({
      data: {
        userId: user.id,
        jobPostingId: body.jobPostingId,
        resumeId: body.resumeId,
        priority: body.priority ?? 'MEDIUM',
        notes: body.notes ?? '',
        source: body.source ?? null,
        status: body.status ?? 'SAVED',
        appliedAt: body.status === 'APPLIED' ? new Date() : null
      },
      include: {
        jobPosting: {
          select: {
            company: true,
            role: true
          }
        },
        resume: {
          select: {
            version: true,
            theme: true
          }
        },
        interviews: {
          select: {
            id: true
          }
        }
      }
    });

    return ok(toApplicationCard(created), 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return fail(message, message === 'Authentication required.' ? 401 : 400);
  }
}

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireCurrentUser } from '@/lib/auth-session';
import { prisma } from '@/lib/db';
import { toUserErrorMessage } from '@/lib/errors';
import { fail, ok } from '@/lib/response';

const CreateSchema = z.object({
  applicationId: z.string().optional(),
  jobPostingId: z.string().optional(),
  roundName: z.string(),
  interviewer: z.string().optional(),
  scheduledAt: z.string().datetime().optional(),
  status: z
    .enum(['APPLIED', 'SCREENING', 'TECHNICAL', 'FINAL', 'OFFER', 'REJECTED', 'WITHDRAWN'])
    .optional(),
  notes: z.string().default(''),
  feedback: z.string().optional()
});

const QuerySchema = z.object({
  status: z
    .enum(['APPLIED', 'SCREENING', 'TECHNICAL', 'FINAL', 'OFFER', 'REJECTED', 'WITHDRAWN'])
    .optional(),
  company: z.string().optional(),
  role: z.string().optional()
});

export async function GET(req: NextRequest) {
  try {
    const user = await requireCurrentUser();
    const query = QuerySchema.parse({
      status: req.nextUrl.searchParams.get('status') ?? undefined,
      company: req.nextUrl.searchParams.get('company') ?? undefined,
      role: req.nextUrl.searchParams.get('role') ?? undefined
    });
    const jobPostingFilter =
      query.company || query.role
        ? {
            jobPosting: {
              ...(query.company ? { company: { contains: query.company } } : {}),
              ...(query.role ? { role: { contains: query.role } } : {})
            }
          }
        : {};
    const interviews = await prisma.interviewRecord.findMany({
      where: {
        userId: user.id,
        ...(query.status ? { status: query.status } : {}),
        ...jobPostingFilter
      },
      include: { jobPosting: true },
      orderBy: { createdAt: 'desc' }
    });

    return ok(interviews);
  } catch (error) {
    const message = toUserErrorMessage(error);
    return fail(message, message === 'Authentication required.' ? 401 : 400);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = CreateSchema.parse(await req.json());
    const user = await requireCurrentUser();

    let applicationId = body.applicationId;
    let jobPostingId = body.jobPostingId;

    if (applicationId) {
      const application = await prisma.application.findUnique({ where: { id: applicationId } });
      if (!application || application.userId !== user.id) {
        return fail('Application not found for this account.', 404);
      }
      jobPostingId = application.jobPostingId;
    }

    if (!jobPostingId) {
      return fail('jobPostingId or applicationId is required.');
    }

    const posting = await prisma.jobPosting.findUnique({ where: { id: jobPostingId } });
    if (!posting || posting.userId !== user.id) {
      return fail('Job posting not found for this account.', 404);
    }

    if (!applicationId) {
      const existingApplication = await prisma.application.findFirst({
        where: {
          userId: user.id,
          jobPostingId
        },
        orderBy: { updatedAt: 'desc' }
      });

      if (existingApplication) {
        applicationId = existingApplication.id;
      } else {
        const createdApplication = await prisma.application.create({
          data: {
            userId: user.id,
            jobPostingId,
            status: 'INTERVIEWING',
            priority: 'MEDIUM'
          }
        });
        applicationId = createdApplication.id;
      }
    }

    const created = await prisma.interviewRecord.create({
      data: {
        userId: user.id,
        jobPostingId,
        applicationId,
        roundName: body.roundName,
        interviewer: body.interviewer,
        scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
        status: body.status,
        notes: body.notes,
        feedback: body.feedback
      },
      include: { jobPosting: true }
    });

    if (applicationId) {
      await prisma.application.update({
        where: { id: applicationId },
        data: {
          status:
            body.status === 'OFFER'
              ? 'OFFER'
              : body.status === 'REJECTED'
                ? 'REJECTED'
                : 'INTERVIEWING'
        }
      });
    }

    return ok(created, 201);
  } catch (error) {
    const message = toUserErrorMessage(error);
    return fail(message, message === 'Authentication required.' ? 401 : 400);
  }
}

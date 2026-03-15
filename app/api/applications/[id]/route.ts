import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireCurrentUser } from '@/lib/auth-session';
import { prisma } from '@/lib/db';
import { fail, ok } from '@/lib/response';

const UpdateSchema = z.object({
  status: z
    .enum(['SAVED', 'READY', 'APPLIED', 'SCREENING', 'INTERVIEWING', 'OFFER', 'REJECTED', 'WITHDRAWN'])
    .optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  resumeId: z.string().nullable().optional(),
  appliedAt: z.string().datetime().nullable().optional(),
  notes: z.string().optional(),
  source: z.string().nullable().optional()
});

const CreateEventSchema = z.object({
  title: z.string().trim().min(1).max(80).optional(),
  detail: z.string().trim().min(1).max(4000),
  nextStep: z.string().trim().max(240).optional(),
  reminderAt: z.string().datetime().optional()
});

function detailPayload(item: {
  id: string;
  status: 'SAVED' | 'READY' | 'APPLIED' | 'SCREENING' | 'INTERVIEWING' | 'OFFER' | 'REJECTED' | 'WITHDRAWN';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  notes: string;
  source: string | null;
  appliedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  jobPosting: { company: string; role: string; description: string; language: string };
  resume: { id: string; version: number; theme: string } | null;
  events: Array<{
    id: string;
    kind: 'MANUAL_NOTE';
    title: string;
    detail: string;
    nextStep: string | null;
    reminderAt: Date | null;
    createdAt: Date;
  }>;
  interviews: Array<{
    id: string;
    roundName: string;
    status: string;
    summary: string | null;
    scheduledAt: Date | null;
    createdAt: Date;
  }>;
}) {
  const timeline = [
    {
      id: `${item.id}-created`,
      kind: 'application_created' as const,
      title: '创建投递',
      detail: `${item.jobPosting.company} · ${item.jobPosting.role}`,
      at: item.createdAt.toISOString()
    },
    ...(item.appliedAt
      ? [
          {
            id: `${item.id}-applied`,
            kind: 'application_status' as const,
            title: '标记为已投递',
            detail: `当前状态 ${item.status}`,
            at: item.appliedAt.toISOString()
          }
        ]
      : []),
    ...(item.resume
      ? [
          {
            id: `${item.id}-resume`,
            kind: 'resume_bound' as const,
            title: '绑定简历版本',
            detail: `V${item.resume.version} / ${item.resume.theme}`,
            at: item.updatedAt.toISOString()
          }
        ]
      : []),
    ...item.events.map((event) => ({
      id: event.id,
      kind: 'manual_note' as const,
      title: event.title,
      detail: event.detail,
      nextStep: event.nextStep,
      reminderAt: event.reminderAt?.toISOString() ?? null,
      at: event.createdAt.toISOString()
    })),
    ...item.interviews.flatMap((interview) => {
      const events: Array<{
        id: string;
        kind: 'interview_scheduled' | 'interview_summary';
        title: string;
        detail: string;
        at: string;
      }> = [
        {
          id: `${interview.id}-scheduled`,
          kind: 'interview_scheduled' as const,
          title: `新增面试：${interview.roundName}`,
          detail: `${interview.status}${interview.scheduledAt ? ` · ${interview.scheduledAt.toISOString()}` : ''}`,
          at: (interview.scheduledAt ?? interview.createdAt).toISOString()
        }
      ];
      if (interview.summary) {
        events.push({
          id: `${interview.id}-summary`,
          kind: 'interview_summary' as const,
          title: `生成面试复盘：${interview.roundName}`,
          detail: interview.summary,
          at: interview.createdAt.toISOString()
        });
      }
      return events;
    })
  ].sort((a, b) => +new Date(b.at) - +new Date(a.at));

  return {
    id: item.id,
    status: item.status,
    priority: item.priority,
    notes: item.notes,
    source: item.source,
    appliedAt: item.appliedAt?.toISOString() ?? null,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
    company: item.jobPosting.company,
    role: item.jobPosting.role,
    description: item.jobPosting.description,
    language: item.jobPosting.language,
    resumeId: item.resume?.id ?? null,
    resumeLabel: item.resume ? `V${item.resume.version} / ${item.resume.theme}` : null,
    timeline,
    interviews: item.interviews.map((interview) => ({
      id: interview.id,
      roundName: interview.roundName,
      status: interview.status,
      summary: interview.summary,
      scheduledAt: interview.scheduledAt?.toISOString() ?? null
    }))
  };
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireCurrentUser();
    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        jobPosting: true,
        resume: {
          select: {
            id: true,
            version: true,
            theme: true
          }
        },
        events: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            kind: true,
            title: true,
            detail: true,
            nextStep: true,
            reminderAt: true,
            createdAt: true
          }
        },
        interviews: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            roundName: true,
            status: true,
            summary: true,
            scheduledAt: true,
            createdAt: true
          }
        }
      }
    });

    if (!application || application.userId !== user.id) {
      return fail('Application not found.', 404);
    }

    return ok(detailPayload(application));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return fail(message, message === 'Authentication required.' ? 401 : 400);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireCurrentUser();
    const body = UpdateSchema.parse(await req.json());
    const application = await prisma.application.findUnique({ where: { id } });

    if (!application || application.userId !== user.id) {
      return fail('Application not found.', 404);
    }

    if (body.resumeId) {
      const resume = await prisma.resume.findUnique({ where: { id: body.resumeId } });
      if (!resume || resume.userId !== user.id) {
        return fail('Resume not found for this account.', 404);
      }
    }

    const updated = await prisma.application.update({
      where: { id },
      data: {
        ...(body.status ? { status: body.status } : {}),
        ...(body.priority ? { priority: body.priority } : {}),
        ...(body.resumeId !== undefined ? { resumeId: body.resumeId } : {}),
        ...(body.appliedAt !== undefined ? { appliedAt: body.appliedAt ? new Date(body.appliedAt) : null } : {}),
        ...(body.notes !== undefined ? { notes: body.notes } : {}),
        ...(body.source !== undefined ? { source: body.source } : {})
      },
      include: {
        jobPosting: true,
        resume: {
          select: {
            id: true,
            version: true,
            theme: true
          }
        },
        events: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            kind: true,
            title: true,
            detail: true,
            nextStep: true,
            reminderAt: true,
            createdAt: true
          }
        },
        interviews: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            roundName: true,
            status: true,
            summary: true,
            scheduledAt: true,
            createdAt: true
          }
        }
      }
    });

    return ok(detailPayload(updated));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return fail(message, message === 'Authentication required.' ? 401 : 400);
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireCurrentUser();
    const body = CreateEventSchema.parse(await req.json());
    const application = await prisma.application.findUnique({ where: { id } });

    if (!application || application.userId !== user.id) {
      return fail('Application not found.', 404);
    }

    const created = await prisma.applicationEvent.create({
      data: {
        userId: user.id,
        applicationId: id,
        kind: 'MANUAL_NOTE',
        title: body.title ?? '手动跟进记录',
        detail: body.detail,
        nextStep: body.nextStep || null,
        reminderAt: body.reminderAt ? new Date(body.reminderAt) : null
      }
    });

    return ok(
      {
        id: created.id,
        kind: 'manual_note',
        title: created.title,
        detail: created.detail,
        nextStep: created.nextStep,
        reminderAt: created.reminderAt?.toISOString() ?? null,
        at: created.createdAt.toISOString()
      },
      201
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return fail(message, message === 'Authentication required.' ? 401 : 400);
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireCurrentUser();
    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        interviews: {
          select: {
            id: true
          }
        }
      }
    });

    if (!application || application.userId !== user.id) {
      return fail('Application not found.', 404);
    }

    if (application.interviews.length > 0) {
      return fail('Applications with interview records cannot be deleted directly.', 409);
    }

    await prisma.application.delete({ where: { id } });
    return ok({ deleted: true, id });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return fail(message, message === 'Authentication required.' ? 401 : 400);
  }
}

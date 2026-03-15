import { requireCurrentUser } from '@/lib/auth-session';
import { prisma } from '@/lib/db';
import { fail, ok } from '@/lib/response';
import { NextRequest } from 'next/server';
import { z } from 'zod';

const UpdateSchema = z.object({
  title: z.string().min(1).max(120)
});

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireCurrentUser();
    const resume = await prisma.resume.findUnique({
      where: { id },
      include: {
        jobPosting: {
          select: {
            company: true,
            role: true
          }
        }
      }
    });

    if (!resume || resume.userId !== user.id) {
      return fail('Resume not found.', 404);
    }

    return ok({
      id: resume.id,
      title: resume.title,
      version: resume.version,
      theme: resume.theme,
      language: resume.language,
      markdown: resume.markdown,
      draft: JSON.parse(resume.contentJson),
      createdAt: resume.createdAt.toISOString(),
      updatedAt: resume.updatedAt.toISOString(),
      parentResumeId: resume.parentResumeId,
      targetLabel: resume.jobPosting ? `${resume.jobPosting.company} · ${resume.jobPosting.role}` : null
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return fail(message, message === 'Authentication required.' ? 401 : 400);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = UpdateSchema.parse(await req.json());
    const user = await requireCurrentUser();
    const resume = await prisma.resume.findUnique({ where: { id } });

    if (!resume || resume.userId !== user.id) {
      return fail('Resume not found.', 404);
    }

    const updated = await prisma.resume.update({
      where: { id },
      data: { title: body.title }
    });

    return ok({
      id: updated.id,
      title: updated.title
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return fail(message, message === 'Authentication required.' ? 401 : 400);
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireCurrentUser();
    const resume = await prisma.resume.findUnique({ where: { id } });

    if (!resume || resume.userId !== user.id) {
      return fail('Resume not found.', 404);
    }

    await prisma.$transaction([
      prisma.resume.updateMany({
        where: { parentResumeId: id, userId: user.id },
        data: { parentResumeId: resume.parentResumeId }
      }),
      prisma.resume.delete({
        where: { id }
      })
    ]);

    return ok({ deleted: true, id });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return fail(message, message === 'Authentication required.' ? 401 : 400);
  }
}

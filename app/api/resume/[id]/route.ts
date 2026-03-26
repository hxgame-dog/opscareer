import { requireCurrentUser } from '@/lib/auth-session';
import { prisma } from '@/lib/db';
import { markdownToResumeDraft } from '@/lib/markdown-parser';
import { fail, ok } from '@/lib/response';
import { NextRequest } from 'next/server';
import { z } from 'zod';

const UpdateSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  markdown: z.string().min(1).optional(),
  isPrimary: z.boolean().optional(),
  duplicate: z.boolean().optional(),
  duplicateTitle: z.string().min(1).max(120).optional()
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
      isPrimary: resume.isPrimary,
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

    if (body.duplicate) {
      const duplicated = await prisma.resume.create({
        data: {
          userId: user.id,
          profileId: resume.profileId,
          jobPostingId: resume.jobPostingId,
          parentResumeId: resume.id,
          title: body.duplicateTitle ?? `${resume.title}-copy`,
          contentJson: resume.contentJson,
          markdown: resume.markdown,
          language: resume.language,
          version: resume.version + 1,
          isPrimary: false,
          theme: resume.theme
        }
      });

      return ok({
        id: duplicated.id,
        title: duplicated.title,
        markdown: duplicated.markdown,
        duplicated: true
      });
    }

    if (body.isPrimary) {
      await prisma.resume.updateMany({
        where: { userId: user.id, isPrimary: true },
        data: { isPrimary: false }
      });
    }

    const updated = await prisma.resume.update({
      where: { id },
      data: {
        ...(body.title ? { title: body.title } : {}),
        ...(body.isPrimary !== undefined ? { isPrimary: body.isPrimary } : {}),
        ...(body.markdown
          ? {
              markdown: body.markdown,
              contentJson: JSON.stringify(markdownToResumeDraft(body.markdown))
            }
          : {})
      }
    });

    return ok({
      id: updated.id,
      title: updated.title,
      markdown: updated.markdown,
      isPrimary: updated.isPrimary
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

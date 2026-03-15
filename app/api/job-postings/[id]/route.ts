import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireCurrentUser } from '@/lib/auth-session';
import { prisma } from '@/lib/db';
import { fail, ok } from '@/lib/response';

const UpdateSchema = z.object({
  saved: z.boolean().optional(),
  company: z.string().min(1).optional(),
  role: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  language: z.enum(['zh-CN', 'en-US']).optional()
});

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireCurrentUser();
    const posting = await prisma.jobPosting.findUnique({ where: { id } });

    if (!posting || posting.userId !== user.id) {
      return fail('Job posting not found.', 404);
    }

    return ok(posting);
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
    const posting = await prisma.jobPosting.findUnique({ where: { id } });

    if (!posting || posting.userId !== user.id) {
      return fail('Job posting not found.', 404);
    }

    const updated = await prisma.jobPosting.update({
      where: { id },
      data: {
        ...(body.saved !== undefined ? { saved: body.saved } : {}),
        ...(body.company ? { company: body.company } : {}),
        ...(body.role ? { role: body.role } : {}),
        ...(body.description ? { description: body.description } : {}),
        ...(body.language ? { language: body.language } : {})
      }
    });

    return ok(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return fail(message, message === 'Authentication required.' ? 401 : 400);
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireCurrentUser();
    const posting = await prisma.jobPosting.findUnique({
      where: { id },
      include: {
        interviews: {
          select: { id: true }
        }
      }
    });

    if (!posting || posting.userId !== user.id) {
      return fail('Job posting not found.', 404);
    }

    if (posting.interviews.length > 0) {
      return fail('This JD already has interview records and cannot be deleted directly.', 409);
    }

    await prisma.jobPosting.delete({
      where: { id }
    });

    return ok({ deleted: true, id });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return fail(message, message === 'Authentication required.' ? 401 : 400);
  }
}

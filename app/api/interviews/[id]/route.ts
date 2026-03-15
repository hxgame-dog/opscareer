import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireCurrentUser } from '@/lib/auth-session';
import { prisma } from '@/lib/db';
import { fail, ok } from '@/lib/response';

const UpdateSchema = z.object({
  status: z
    .enum(['APPLIED', 'SCREENING', 'TECHNICAL', 'FINAL', 'OFFER', 'REJECTED', 'WITHDRAWN'])
    .optional(),
  notes: z.string().optional(),
  feedback: z.string().optional()
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = UpdateSchema.parse(await req.json());
    const user = await requireCurrentUser();

    const existing = await prisma.interviewRecord.findUnique({ where: { id } });
    if (!existing || existing.userId !== user.id) {
      return fail('Interview not found.', 404);
    }

    const updated = await prisma.interviewRecord.update({
      where: { id },
      data: {
        ...(body.status ? { status: body.status } : {}),
        ...(body.notes !== undefined ? { notes: body.notes } : {}),
        ...(body.feedback !== undefined ? { feedback: body.feedback } : {})
      },
      include: { jobPosting: true }
    });

    return ok(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return fail(message, message === 'Authentication required.' ? 401 : 400);
  }
}

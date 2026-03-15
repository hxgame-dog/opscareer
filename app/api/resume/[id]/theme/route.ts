import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireCurrentUser } from '@/lib/auth-session';
import { prisma } from '@/lib/db';
import { resumeToMarkdown } from '@/lib/markdown';
import { fail, ok } from '@/lib/response';

const BodySchema = z.object({
  theme: z.enum(['CLASSIC', 'EXECUTIVE', 'MODERN'])
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const body = BodySchema.parse(await req.json());
    const { id } = await params;
    const user = await requireCurrentUser();
    const resume = await prisma.resume.findUnique({ where: { id } });

    if (!resume || resume.userId !== user.id) {
      return fail('Resume not found.', 404);
    }

    const content = JSON.parse(resume.contentJson);
    const markdown = resumeToMarkdown(content, body.theme);
    const updated = await prisma.resume.update({
      where: { id },
      data: {
        theme: body.theme,
        markdown
      }
    });

    return ok({
      resumeId: updated.id,
      theme: updated.theme,
      markdown: updated.markdown
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return fail(message, message === 'Authentication required.' ? 401 : 400);
  }
}

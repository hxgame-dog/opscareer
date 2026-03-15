import { z } from 'zod';
import { requireCurrentUser } from '@/lib/auth-session';
import { prisma } from '@/lib/db';
import { buildResumeDiff } from '@/lib/resume-diff';
import { fail, ok } from '@/lib/response';
import { ResumeDraft } from '@/types/domain';

const QuerySchema = z.object({
  baseId: z.string().min(1),
  compareId: z.string().min(1)
});

export async function GET(req: Request) {
  try {
    const user = await requireCurrentUser();
    const parsed = QuerySchema.parse({
      baseId: new URL(req.url).searchParams.get('baseId'),
      compareId: new URL(req.url).searchParams.get('compareId')
    });

    const resumes = await prisma.resume.findMany({
      where: {
        userId: user.id,
        id: { in: [parsed.baseId, parsed.compareId] }
      }
    });

    const base = resumes.find((item) => item.id === parsed.baseId);
    const compare = resumes.find((item) => item.id === parsed.compareId);

    if (!base || !compare) {
      return fail('Both resume versions must exist in this account.', 404);
    }

    return ok({
      base: {
        id: base.id,
        title: base.title,
        version: base.version
      },
      compare: {
        id: compare.id,
        title: compare.title,
        version: compare.version
      },
      diff: buildResumeDiff(
        JSON.parse(base.contentJson) as ResumeDraft,
        JSON.parse(compare.contentJson) as ResumeDraft
      )
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return fail(message, message === 'Authentication required.' ? 401 : 400);
  }
}

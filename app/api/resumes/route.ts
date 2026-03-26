import { requireCurrentUser } from '@/lib/auth-session';
import { prisma } from '@/lib/db';
import { toUserErrorMessage } from '@/lib/errors';
import { buildResumeHistoryGroups } from '@/lib/resume-history';
import { fail, ok } from '@/lib/response';

export async function GET(req: Request) {
  try {
    const user = await requireCurrentUser();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q')?.trim();
    const primaryOnly = searchParams.get('primaryOnly') === 'true';
    const resumes = await prisma.resume.findMany({
      where: {
        userId: user.id,
        ...(primaryOnly ? { isPrimary: true } : {}),
        ...(q
          ? {
              OR: [
                { title: { contains: q } },
                { markdown: { contains: q } },
                { jobPosting: { is: { company: { contains: q } } } },
                { jobPosting: { is: { role: { contains: q } } } }
              ]
            }
          : {})
      },
      select: {
        id: true,
        title: true,
        version: true,
        isPrimary: true,
        theme: true,
        parentResumeId: true,
        createdAt: true,
        updatedAt: true,
        jobPosting: {
          select: {
            company: true,
            role: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    return ok({
      groups: buildResumeHistoryGroups(resumes)
    });
  } catch (error) {
    const message = toUserErrorMessage(error);
    return fail(message, message === 'Authentication required.' ? 401 : 400);
  }
}

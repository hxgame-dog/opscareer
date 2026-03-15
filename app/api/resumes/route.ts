import { requireCurrentUser } from '@/lib/auth-session';
import { prisma } from '@/lib/db';
import { buildResumeHistoryGroups } from '@/lib/resume-history';
import { fail, ok } from '@/lib/response';

export async function GET() {
  try {
    const user = await requireCurrentUser();
    const resumes = await prisma.resume.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        title: true,
        version: true,
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
    const message = error instanceof Error ? error.message : 'Unknown error';
    return fail(message, message === 'Authentication required.' ? 401 : 400);
  }
}

import { NextRequest } from 'next/server';
import { requireCurrentUser } from '@/lib/auth-session';
import { prisma } from '@/lib/db';
import { toMockInterviewDetail } from '@/lib/mock-interview-payload';
import { fail, ok } from '@/lib/response';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireCurrentUser();
    const session = await prisma.mockInterviewSession.findUnique({
      where: { id },
      include: {
        jobPosting: {
          select: {
            company: true,
            role: true
          }
        },
        questions: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            order: true,
            category: true,
            question: true,
            intent: true,
            difficulty: true
          }
        },
        turns: {
          orderBy: { answeredAt: 'asc' },
          select: {
            id: true,
            questionId: true,
            audioMimeType: true,
            audioDurationSec: true,
            transcript: true,
            feedbackJson: true,
            answeredAt: true
          }
        }
      }
    });

    if (!session || session.userId !== user.id) {
      return fail('Mock interview session not found.', 404);
    }

    return ok(toMockInterviewDetail(session));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return fail(message, message === 'Authentication required.' ? 401 : 400);
  }
}

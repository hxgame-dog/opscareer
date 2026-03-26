import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireCurrentUser } from '@/lib/auth-session';
import { prisma } from '@/lib/db';
import { buildJobPostingInsight } from '@/lib/job-posting-insight';
import { fail, ok } from '@/lib/response';
import type { JobPostingDetail, ResumeDiagnosisReport } from '@/types/domain';

const UpdateSchema = z.object({
  saved: z.boolean().optional(),
  company: z.string().min(1).optional(),
  role: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  language: z.enum(['zh-CN', 'en-US']).optional()
});

function parseJsonArray(value: string) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function toDiagnosis(item: {
  score: number;
  strengthsJson: string;
  gapsJson: string;
  suggestionsJson: string;
  riskFlagsJson: string;
}): ResumeDiagnosisReport {
  return {
    score: item.score,
    dimensions: {
      keywordMatch: item.score,
      relevance: item.score,
      quantifiedImpact: Math.max(0, item.score - 8),
      atsCompatibility: Math.max(0, item.score - 5),
      riskLevel: Math.max(0, 100 - item.score)
    },
    strengths: parseJsonArray(item.strengthsJson),
    gaps: parseJsonArray(item.gapsJson),
    suggestions: parseJsonArray(item.suggestionsJson),
    riskFlags: parseJsonArray(item.riskFlagsJson)
  };
}

async function loadPostingDetail(id: string, userId: string): Promise<JobPostingDetail | null> {
  const posting = await prisma.jobPosting.findUnique({
    where: { id },
    include: {
      applications: { select: { id: true } },
      interviews: { select: { id: true } },
      mockInterviewSessions: { select: { id: true } },
      diagnoses: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: {
          score: true,
          strengthsJson: true,
          gapsJson: true,
          suggestionsJson: true,
          riskFlagsJson: true
        }
      }
    }
  });

  if (!posting || posting.userId !== userId) return null;

  const latestDiagnosis = posting.diagnoses[0] ? toDiagnosis(posting.diagnoses[0]) : null;
  const linkedStats = {
    applicationCount: posting.applications.length,
    interviewCount: posting.interviews.length,
    mockInterviewCount: posting.mockInterviewSessions.length,
    diagnosisCount: posting.diagnoses.length
  };
  const insight = buildJobPostingInsight({
    description: posting.description,
    savedKeywords: parseJsonArray(posting.keywordsJson),
    latestDiagnosis,
    linkedStats
  });

  return {
    id: posting.id,
    company: posting.company,
    role: posting.role,
    description: posting.description,
    language: posting.language as JobPostingDetail['language'],
    source: posting.source as JobPostingDetail['source'],
    saved: posting.saved,
    updatedAt: posting.updatedAt.toISOString(),
    createdAt: posting.createdAt.toISOString(),
    insight,
    linkedStats,
    latestDiagnosis
  };
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireCurrentUser();
    const posting = await loadPostingDetail(id, user.id);

    if (!posting) {
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

    await prisma.jobPosting.update({
      where: { id },
      data: {
        ...(body.saved !== undefined ? { saved: body.saved } : {}),
        ...(body.company ? { company: body.company } : {}),
        ...(body.role ? { role: body.role } : {}),
        ...(body.description ? { description: body.description } : {}),
        ...(body.language ? { language: body.language } : {})
      }
    });

    const detail = await loadPostingDetail(id, user.id);
    return ok(detail!);
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

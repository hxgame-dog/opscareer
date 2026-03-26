import { requireCurrentUser } from '@/lib/auth-session';
import { prisma } from '@/lib/db';
import { toUserErrorMessage } from '@/lib/errors';
import { fail, ok } from '@/lib/response';
import type {
  ApplicationCard,
  ApplicationPriority,
  ApplicationStatus,
  DashboardInterviewItem,
  DashboardJobPostingItem,
  DashboardPriorityCount,
  DashboardReminderItem,
  DashboardStageCount,
  DashboardSummary,
  MockInterviewListItem
} from '@/types/domain';

function toApplicationCard(item: {
  id: string;
  status: ApplicationCard['status'];
  priority: ApplicationCard['priority'];
  notes: string;
  source: string | null;
  nextStep: string | null;
  deadlineAt: Date | null;
  appliedAt: Date | null;
  updatedAt: Date;
  jobPosting: { company: string; role: string };
  resume: { version: number; theme: string } | null;
  interviews: Array<{ id: string }>;
}): ApplicationCard {
  return {
    id: item.id,
    status: item.status,
    priority: item.priority,
    notes: item.notes,
    source: item.source,
    nextStep: item.nextStep,
    deadlineAt: item.deadlineAt?.toISOString() ?? null,
    appliedAt: item.appliedAt?.toISOString() ?? null,
    updatedAt: item.updatedAt.toISOString(),
    company: item.jobPosting.company,
    role: item.jobPosting.role,
    resumeLabel: item.resume ? `V${item.resume.version} / ${item.resume.theme}` : null,
    interviewCount: item.interviews.length
  };
}

function toMockInterviewListItem(item: {
  id: string;
  status: MockInterviewListItem['status'];
  language: string;
  targetLevel: string;
  questionCount: number;
  overallScore: number | null;
  updatedAt: Date;
  jobPosting: { company: string; role: string };
  turns: Array<{ id: string }>;
}): MockInterviewListItem {
  return {
    id: item.id,
    status: item.status,
    company: item.jobPosting.company,
    role: item.jobPosting.role,
    language: item.language as MockInterviewListItem['language'],
    targetLevel: item.targetLevel,
    questionCount: item.questionCount,
    answeredCount: item.turns.length,
    overallScore: item.overallScore,
    updatedAt: item.updatedAt.toISOString()
  };
}

export async function GET() {
  try {
    const user = await requireCurrentUser();

    const [
      resumeCount,
      jobCount,
      applicationRows,
      interviewRows,
      mockRows,
      mockInterviewCount,
      reminderRows,
      recentJobRows,
      interviewCount
    ] = await Promise.all([
      prisma.resume.count({ where: { userId: user.id } }),
      prisma.jobPosting.count({ where: { userId: user.id, saved: true } }),
      prisma.application.findMany({
        where: { userId: user.id },
        include: {
          jobPosting: { select: { company: true, role: true } },
          resume: { select: { version: true, theme: true } },
          interviews: { select: { id: true } }
        },
        orderBy: { updatedAt: 'desc' }
      }),
      prisma.interviewRecord.findMany({
        where: { userId: user.id },
        include: { jobPosting: { select: { company: true, role: true } } },
        orderBy: [{ scheduledAt: 'asc' }, { createdAt: 'desc' }],
        take: 6
      }),
      prisma.mockInterviewSession.findMany({
        where: { userId: user.id },
        include: {
          jobPosting: { select: { company: true, role: true } },
          turns: { select: { id: true } }
        },
        orderBy: { updatedAt: 'desc' },
        take: 6
      }),
      prisma.mockInterviewSession.count({ where: { userId: user.id } }),
      prisma.applicationEvent.findMany({
        where: {
          userId: user.id,
          reminderAt: { not: null }
        },
        include: {
          application: {
            select: {
              id: true,
              jobPosting: { select: { company: true, role: true } }
            }
          }
        },
        orderBy: { reminderAt: 'asc' },
        take: 6
      }),
      prisma.jobPosting.findMany({
        where: { userId: user.id, saved: true },
        select: { id: true, company: true, role: true, language: true, saved: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
        take: 6
      }),
      prisma.interviewRecord.count({ where: { userId: user.id } })
    ]);

    const applications = applicationRows.map(toApplicationCard);
    const activeStatuses = new Set(['READY', 'APPLIED', 'SCREENING', 'INTERVIEWING']);
    const counts: DashboardSummary['counts'] = {
      resumes: resumeCount,
      jobs: jobCount,
      applications: applications.length,
      activeApplications: applications.filter((item) => activeStatuses.has(item.status)).length,
      mockInterviews: mockInterviewCount,
      interviews: interviewCount
    };

    const applicationStatuses: ApplicationStatus[] = [
      'SAVED',
      'READY',
      'APPLIED',
      'SCREENING',
      'INTERVIEWING',
      'OFFER',
      'REJECTED',
      'WITHDRAWN'
    ];
    const applicationPriorities: ApplicationPriority[] = ['HIGH', 'MEDIUM', 'LOW'];

    const stageCounts: DashboardStageCount[] = applicationStatuses.map((status) => ({
      status,
      count: applications.filter((item) => item.status === status).length
    }));

    const priorityCounts: DashboardPriorityCount[] = applicationPriorities.map((priority) => ({
      priority,
      count: applications.filter((item) => item.priority === priority).length
    }));

    const reminders: DashboardReminderItem[] = reminderRows.map((item) => ({
      id: item.id,
      title: item.title,
      detail: item.detail,
      nextStep: item.nextStep,
      reminderAt: item.reminderAt?.toISOString() ?? null,
      company: item.application.jobPosting.company,
      role: item.application.jobPosting.role,
      applicationId: item.application.id
    }));

    const recentInterviews: DashboardInterviewItem[] = interviewRows.map((item) => ({
      id: item.id,
      roundName: item.roundName,
      status: item.status,
      summary: item.summary,
      scheduledAt: item.scheduledAt?.toISOString() ?? null,
      createdAt: item.createdAt.toISOString(),
      jobPosting: item.jobPosting
    }));

    const recentJobs: DashboardJobPostingItem[] = recentJobRows.map((item) => ({
      id: item.id,
      company: item.company,
      role: item.role,
      language: item.language as DashboardJobPostingItem['language'],
      saved: item.saved,
      updatedAt: item.updatedAt.toISOString()
    }));

    const summary: DashboardSummary = {
      counts,
      stageCounts,
      priorityCounts,
      reminders,
      recentApplications: applications.slice(0, 6),
      recentMockInterviews: mockRows.map(toMockInterviewListItem),
      recentInterviews,
      recentJobs
    };

    return ok(summary);
  } catch (error) {
    const message = toUserErrorMessage(error);
    return fail(message, message === 'Authentication required.' ? 401 : 400);
  }
}

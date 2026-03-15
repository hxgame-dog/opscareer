import { MockInterviewEvaluation, MockInterviewSession, MockInterviewSummary } from '@/types/domain';

function parseEvaluation(value: string | null): MockInterviewEvaluation | null {
  if (!value) return null;
  return JSON.parse(value) as MockInterviewEvaluation;
}

function parseSummary(value: string | null): MockInterviewSummary | null {
  if (!value) return null;
  return JSON.parse(value) as MockInterviewSummary;
}

export function toMockInterviewDetail(item: {
  id: string;
  status: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';
  jobPostingId: string;
  language: string;
  targetLevel: string;
  questionCount: number;
  overallScore: number | null;
  summaryJson: string | null;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  jobPosting: { company: string; role: string };
  questions: Array<{
    id: string;
    order: number;
    category: 'EXPERIENCE' | 'PROJECT' | 'TECHNICAL' | 'SCENARIO' | 'COMMUNICATION';
    question: string;
    intent: string;
    difficulty: string;
  }>;
  turns: Array<{
    id: string;
    questionId: string;
    audioMimeType: string;
    audioDurationSec: number | null;
    transcript: string;
    feedbackJson: string | null;
    answeredAt: Date;
  }>;
}): MockInterviewSession {
  const turns = item.turns.map((turn) => ({
    id: turn.id,
    questionId: turn.questionId,
    audioMimeType: turn.audioMimeType,
    audioDurationSec: turn.audioDurationSec,
    transcript: turn.transcript,
    evaluation: parseEvaluation(turn.feedbackJson),
    answeredAt: turn.answeredAt.toISOString()
  }));
  const answeredQuestionIds = new Set(item.turns.filter((turn) => Boolean(turn.feedbackJson)).map((turn) => turn.questionId));
  const currentQuestion = item.questions.find((question) => !answeredQuestionIds.has(question.id)) ?? null;

  return {
    id: item.id,
    jobPostingId: item.jobPostingId,
    status: item.status,
    company: item.jobPosting.company,
    role: item.jobPosting.role,
    language: item.language as 'zh-CN' | 'en-US',
    targetLevel: item.targetLevel,
    questionCount: item.questionCount,
    currentQuestionId: currentQuestion?.id ?? null,
    startedAt: item.startedAt?.toISOString() ?? null,
    completedAt: item.completedAt?.toISOString() ?? null,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
    questions: item.questions,
    turns,
    overallScore: item.overallScore,
    summary: parseSummary(item.summaryJson)
  };
}

export function toMockInterviewListItem(item: {
  id: string;
  status: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';
  language: string;
  targetLevel: string;
  questionCount: number;
  overallScore: number | null;
  updatedAt: Date;
  jobPosting: { company: string; role: string };
  turns: Array<{ id: string }>;
}) {
  return {
    id: item.id,
    status: item.status,
    company: item.jobPosting.company,
    role: item.jobPosting.role,
    language: item.language as 'zh-CN' | 'en-US',
    targetLevel: item.targetLevel,
    questionCount: item.questionCount,
    answeredCount: item.turns.length,
    overallScore: item.overallScore,
    updatedAt: item.updatedAt.toISOString()
  };
}

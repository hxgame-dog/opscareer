export type Language = 'zh-CN' | 'en-US';
export type ResumeTheme = 'CLASSIC' | 'EXECUTIVE' | 'MODERN';
export type JobPostingSource = 'MANUAL' | 'RESUME_OPTIMIZE' | 'INTERVIEW_PREP';
export type ApplicationStatus =
  | 'SAVED'
  | 'READY'
  | 'APPLIED'
  | 'SCREENING'
  | 'INTERVIEWING'
  | 'OFFER'
  | 'REJECTED'
  | 'WITHDRAWN';
export type ApplicationPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type MockInterviewSessionStatus = 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';
export type MockInterviewQuestionCategory = 'EXPERIENCE' | 'PROJECT' | 'TECHNICAL' | 'SCENARIO' | 'COMMUNICATION';

export interface MockInterviewDimensionScores {
  relevance: number;
  technicalDepth: number;
  structure: number;
  jobFit: number;
  evidence: number;
}

export interface MockInterviewQuestion {
  id: string;
  order: number;
  category: MockInterviewQuestionCategory;
  question: string;
  intent: string;
  difficulty: string;
}

export interface MockInterviewEvaluation {
  score: number;
  dimensionScores: MockInterviewDimensionScores;
  strengths: string[];
  gaps: string[];
  improvedAnswer: string;
  followUpAdvice: string;
}

export interface MockInterviewSummary {
  overallScore: number;
  dimensionScores: MockInterviewDimensionScores;
  performanceLevel: string;
  topStrengths: string[];
  topRisks: string[];
  recommendedTopics: string[];
}

export interface MockInterviewTurn {
  id: string;
  questionId: string;
  audioMimeType: string;
  audioDurationSec: number | null;
  transcript: string;
  evaluation: MockInterviewEvaluation | null;
  answeredAt: string;
}

export interface MockInterviewSession {
  id: string;
  jobPostingId: string;
  status: MockInterviewSessionStatus;
  company: string;
  role: string;
  language: Language;
  targetLevel: string;
  questionCount: number;
  currentQuestionId: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  questions: MockInterviewQuestion[];
  turns: MockInterviewTurn[];
  overallScore: number | null;
  summary: MockInterviewSummary | null;
}

export interface MockInterviewListItem {
  id: string;
  status: MockInterviewSessionStatus;
  company: string;
  role: string;
  language: Language;
  targetLevel: string;
  questionCount: number;
  answeredCount: number;
  overallScore: number | null;
  updatedAt: string;
}

export interface ProfileInput {
  basics: {
    name: string;
    email: string;
    phone?: string;
    location?: string;
    summary: string;
    yearsOfExperience?: number;
  };
  experiences: Array<{
    company: string;
    role: string;
    start: string;
    end?: string;
    achievements: string[];
    techStack?: string[];
  }>;
  projects: Array<{
    name: string;
    role?: string;
    summary: string;
    highlights: string[];
  }>;
  skills: string[];
  education: Array<{
    school: string;
    degree: string;
    major?: string;
    start?: string;
    end?: string;
  }>;
  language?: Language;
}

export interface ResumeDraft {
  headline: string;
  summary: string;
  skills: string[];
  experiences: Array<{
    company: string;
    role: string;
    period: string;
    bullets: string[];
  }>;
  projects: Array<{
    name: string;
    bullets: string[];
  }>;
  education: Array<{
    school: string;
    detail: string;
  }>;
}

export interface ResumeImportPreview {
  filename: string;
  title: string;
  language: Language;
  theme: ResumeTheme;
  markdown: string;
  profile: ProfileInput;
  draft: ResumeDraft;
}

export interface ResumeThemeDefinition {
  id: ResumeTheme;
  name: string;
  tone: string;
  accentColor: string;
  fontFamily: string;
  sectionLabel: string;
}

export interface ResumeDiagnosisReport {
  score: number;
  dimensions: {
    keywordMatch: number;
    relevance: number;
    quantifiedImpact: number;
    atsCompatibility: number;
    riskLevel: number;
  };
  strengths: string[];
  gaps: string[];
  suggestions: string[];
  riskFlags: string[];
}

export interface JobPostingInsight {
  score: number;
  summary: string;
  keywords: string[];
  strengths: string[];
  risks: string[];
  nextActions: string[];
  signals: {
    englishRequired: boolean;
    seniority: 'entry' | 'mid' | 'senior' | 'lead' | 'unknown';
    urgency: 'low' | 'medium' | 'high';
  };
}

export interface JobPostingDetail {
  id: string;
  company: string;
  role: string;
  description: string;
  language: Language;
  source: JobPostingSource;
  saved: boolean;
  updatedAt: string;
  createdAt: string;
  insight: JobPostingInsight;
  linkedStats: {
    applicationCount: number;
    interviewCount: number;
    mockInterviewCount: number;
    diagnosisCount: number;
  };
  latestDiagnosis: ResumeDiagnosisReport | null;
}

export interface InterviewPrepResult {
  strategy: string;
  qa: Array<{
    question: string;
    answer: string;
    followUp: string;
  }>;
}

export interface ResumeDiffResult {
  summary: {
    before: string;
    after: string;
  };
  skills: {
    added: string[];
    removed: string[];
    unchanged: string[];
  };
  experiences: Array<{
    company: string;
    role: string;
    addedBullets: string[];
    removedBullets: string[];
  }>;
  projects: Array<{
    name: string;
    addedBullets: string[];
    removedBullets: string[];
  }>;
}

export interface ApplicationCard {
  id: string;
  status: ApplicationStatus;
  priority: ApplicationPriority;
  notes: string;
  source: string | null;
  nextStep: string | null;
  deadlineAt: string | null;
  appliedAt: string | null;
  updatedAt: string;
  company: string;
  role: string;
  resumeLabel: string | null;
  interviewCount: number;
}

export interface ApplicationBoardColumn {
  status: ApplicationStatus;
  items: ApplicationCard[];
}

export interface ApplicationDetail {
  id: string;
  status: ApplicationStatus;
  priority: ApplicationPriority;
  notes: string;
  source: string | null;
  nextStep: string | null;
  deadlineAt: string | null;
  appliedAt: string | null;
  createdAt: string;
  updatedAt: string;
  company: string;
  role: string;
  description: string;
  language: Language;
  resumeId: string | null;
  resumeLabel: string | null;
  timeline: Array<{
    id: string;
    kind:
      | 'application_created'
      | 'application_status'
      | 'resume_bound'
      | 'interview_scheduled'
      | 'interview_summary'
      | 'manual_note';
    title: string;
    detail: string;
    nextStep: string | null;
    reminderAt: string | null;
    at: string;
  }>;
  interviews: Array<{
    id: string;
    roundName: string;
    status: string;
    summary: string | null;
    scheduledAt: string | null;
  }>;
}

export interface DashboardReminderItem {
  id: string;
  title: string;
  detail: string;
  nextStep: string | null;
  reminderAt: string | null;
  company: string;
  role: string;
  applicationId: string;
}

export interface DashboardStageCount {
  status: ApplicationStatus;
  count: number;
}

export interface DashboardPriorityCount {
  priority: ApplicationPriority;
  count: number;
}

export interface DashboardJobPostingItem {
  id: string;
  company: string;
  role: string;
  language: Language;
  saved: boolean;
  updatedAt: string;
}

export interface DashboardInterviewItem {
  id: string;
  roundName: string;
  status: string;
  summary: string | null;
  scheduledAt: string | null;
  createdAt: string;
  jobPosting: {
    company: string;
    role: string;
  };
}

export interface DashboardSummary {
  counts: {
    resumes: number;
    jobs: number;
    applications: number;
    activeApplications: number;
    mockInterviews: number;
    interviews: number;
  };
  stageCounts: DashboardStageCount[];
  priorityCounts: DashboardPriorityCount[];
  reminders: DashboardReminderItem[];
  recentApplications: ApplicationCard[];
  recentMockInterviews: MockInterviewListItem[];
  recentInterviews: DashboardInterviewItem[];
  recentJobs: DashboardJobPostingItem[];
}

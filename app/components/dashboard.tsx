'use client';

import { startTransition, useEffect, useRef, useState } from 'react';
import { signOut } from 'next-auth/react';
import { applicationStatuses } from '@/lib/applications';
import {
  ApplicationBoardColumn,
  ApplicationCard,
  ApplicationDetail,
  ApplicationPriority,
  ApplicationStatus,
  Language,
  MockInterviewEvaluation,
  MockInterviewListItem,
  MockInterviewQuestion,
  MockInterviewSession,
  ProfileInput,
  ResumeDiffResult,
  ResumeImportPreview,
  ResumeTheme
} from '@/types/domain';
import { Sidebar } from '@/app/components/layout/sidebar';
import { Topbar } from '@/app/components/layout/topbar';
import { DetailPanel } from '@/app/components/layout/detail-panel';
import { ConfirmDialog } from '@/app/components/ui/confirm-dialog';
import { ProfileView } from '@/app/components/views/profile-view';
import { HomeView } from '@/app/components/views/home-view';
import { ResumesView } from '@/app/components/views/resumes-view';
import { JobsView } from '@/app/components/views/jobs-view';
import { MockInterviewView } from '@/app/components/views/mock-interview-view';
import { ApplicationsView } from '@/app/components/views/applications-view';
import { InterviewsView } from '@/app/components/views/interviews-view';
import { PageHeader } from '@/app/components/ui/page-header';
import { ActionBar } from '@/app/components/ui/action-bar';
import { PanelShell } from '@/app/components/ui/panel-shell';
import {
  getWorkspaceNavigation,
  getWorkspaceViewMeta,
  type WorkspaceNavigationItem,
  type WorkspaceView,
  type WorkspaceViewMeta
} from '@/lib/workspace-ui';

const DEFAULT_PROFILE: ProfileInput = {
  basics: {
    name: '张三',
    email: 'zhangsan@example.com',
    phone: '13800000000',
    location: '上海',
    summary: '5 年后端与 SRE 经验，擅长高可用平台、自动化运维与成本优化。',
    yearsOfExperience: 5
  },
  experiences: [
    {
      company: '示例科技',
      role: 'SRE 工程师',
      start: '2021-03',
      end: '2025-03',
      achievements: ['搭建监控体系，故障平均恢复时间下降 40%', '推动 IaC，发布效率提升 2 倍'],
      techStack: ['Kubernetes', 'Terraform', 'Prometheus', 'Go']
    }
  ],
  projects: [
    {
      name: '多集群稳定性治理项目',
      role: '负责人',
      summary: '建设统一告警与容量预测机制',
      highlights: ['上线后 P1 故障数下降 35%', '资源利用率提升 18%']
    }
  ],
  skills: ['Kubernetes', 'Terraform', 'Go', 'Linux', 'AWS'],
  education: [
    {
      school: '某大学',
      degree: '本科',
      major: '计算机科学'
    }
  ],
  language: 'zh-CN'
};

const DEFAULT_JD = {
  company: '目标公司',
  role: '高级 SRE',
  description:
    '负责核心服务稳定性与自动化平台建设，要求熟悉 Kubernetes、云原生监控、容量规划、跨团队协作和故障复盘能力。',
  language: 'zh-CN'
};

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

type DashboardProps = {
  user: {
    id: string;
    name: string;
    email: string;
  };
};

type ResumeVersion = {
  id: string;
  title: string;
  version: number;
  theme: ResumeTheme;
  parentResumeId: string | null;
  createdAt: string;
  updatedAt: string;
  targetLabel: string | null;
};

type ResumeHistoryGroup = {
  rootResumeId: string;
  displayTitle: string;
  latestResumeId: string;
  versionCount: number;
  updatedAt: string;
  versions: ResumeVersion[];
};

type JobPostingRecord = {
  id: string;
  company: string;
  role: string;
  description: string;
  language: Language;
  source: 'MANUAL' | 'RESUME_OPTIMIZE' | 'INTERVIEW_PREP';
  saved: boolean;
  updatedAt: string;
};

type InterviewRecord = {
  id: string;
  roundName: string;
  notes: string;
  summary: string | null;
  status: 'APPLIED' | 'SCREENING' | 'TECHNICAL' | 'FINAL' | 'OFFER' | 'REJECTED' | 'WITHDRAWN';
  applicationId?: string | null;
  jobPosting: {
    company: string;
    role: string;
  };
};

type ResumeDiffPayload = {
  base: { id: string; title: string; version: number };
  compare: { id: string; title: string; version: number };
  diff: ResumeDiffResult;
};

async function callApi<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers ?? {})
    }
  });
  const json = (await res.json()) as ApiResponse<T>;
  if (!json.success || !json.data) {
    throw new Error(json.error ?? 'Request failed');
  }
  return json.data;
}

export function Dashboard({ user }: DashboardProps) {
  const NOTEBOOK_BREAKPOINT = 1360;
  const notebookHeavyViews: WorkspaceView[] = ['resumes', 'jobs', 'mock', 'applications', 'interviews'];
  const previousNotebookMatchRef = useRef<boolean | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [activeView, setActiveView] = useState<WorkspaceView>('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [isNotebookLayout, setIsNotebookLayout] = useState(false);
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const [flash, setFlash] = useState<{ text: string; tone: 'success' | 'error' | 'info' } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    description: string;
    confirmLabel?: string;
    tone?: 'default' | 'danger';
    busyKey?: string;
    onConfirm: () => Promise<void> | void;
  } | null>(null);
  const [models, setModels] = useState<Array<{ name: string; recommended: boolean }>>([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [profileDraft, setProfileDraft] = useState<ProfileInput>(DEFAULT_PROFILE);
  const [profileText, setProfileText] = useState(JSON.stringify(DEFAULT_PROFILE, null, 2));
  const [showProfileJson, setShowProfileJson] = useState(false);
  const [profileJsonError, setProfileJsonError] = useState('');
  const [style, setStyle] = useState('professional');
  const [resumeMarkdown, setResumeMarkdown] = useState('');
  const [resumeId, setResumeId] = useState('');
  const [resumeTitle, setResumeTitle] = useState('');
  const [activeTheme, setActiveTheme] = useState<ResumeTheme>('CLASSIC');
  const [resumeLanguage, setResumeLanguage] = useState<Language>('zh-CN');
  const [resumeGroups, setResumeGroups] = useState<ResumeHistoryGroup[]>([]);
  const [resumeImportPreview, setResumeImportPreview] = useState<ResumeImportPreview | null>(null);
  const [jdText, setJdText] = useState(JSON.stringify(DEFAULT_JD, null, 2));
  const [jdLibrary, setJdLibrary] = useState<JobPostingRecord[]>([]);
  const [selectedJobPosting, setSelectedJobPosting] = useState<JobPostingRecord | null>(null);
  const [applicationView, setApplicationView] = useState<'board' | 'list'>('board');
  const [applicationFilters, setApplicationFilters] = useState({
    status: '',
    company: '',
    role: '',
    priority: '',
    q: ''
  });
  const [applicationBoard, setApplicationBoard] = useState<ApplicationBoardColumn[]>([]);
  const [applications, setApplications] = useState<ApplicationCard[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<ApplicationDetail | null>(null);
  const [draggingApplicationId, setDraggingApplicationId] = useState('');
  const [dragTargetStatus, setDragTargetStatus] = useState<ApplicationStatus | ''>('');
  const [applicationTimelineForm, setApplicationTimelineForm] = useState({
    title: '跟进记录',
    detail: '',
    nextStep: '',
    reminderAt: ''
  });
  const [applicationInterviewForm, setApplicationInterviewForm] = useState({
    roundName: '一面',
    interviewer: '',
    scheduledAt: '',
    status: 'SCREENING' as InterviewRecord['status'],
    notes: '准备围绕岗位要求进行一轮针对性沟通。'
  });
  const [jdSearch, setJdSearch] = useState('');
  const [savedOnly, setSavedOnly] = useState(true);
  const [optResult, setOptResult] = useState('');
  const [prepResult, setPrepResult] = useState('');
  const [targetLevel, setTargetLevel] = useState('senior');
  const [interviews, setInterviews] = useState<InterviewRecord[]>([]);
  const [interviewFilters, setInterviewFilters] = useState({
    status: '',
    company: '',
    role: ''
  });
  const [mockInterviewFilters, setMockInterviewFilters] = useState({
    status: '',
    q: ''
  });
  const [mockInterviewSetup, setMockInterviewSetup] = useState({
    jobPostingId: '',
    targetLevel: 'senior',
    language: 'zh-CN' as Language,
    questionCount: 5 as 3 | 5 | 8
  });
  const [mockInterviewSessions, setMockInterviewSessions] = useState<MockInterviewListItem[]>([]);
  const [selectedMockInterview, setSelectedMockInterview] = useState<MockInterviewSession | null>(null);
  const [isRecordingMockInterview, setIsRecordingMockInterview] = useState(false);
  const [isSubmittingMockTurn, setIsSubmittingMockTurn] = useState(false);
  const [interviewForm, setInterviewForm] = useState({
    applicationId: '',
    jobPostingId: '',
    roundName: '一面',
    notes: '整体沟通顺畅，系统设计环节回答一般。'
  });
  const [diffSelection, setDiffSelection] = useState({
    baseId: '',
    compareId: ''
  });
  const [diffResult, setDiffResult] = useState<ResumeDiffPayload | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const mockRecorderRef = useRef<MediaRecorder | null>(null);
  const mockRecorderChunksRef = useRef<Blob[]>([]);
  const mockRecorderStreamRef = useRef<MediaStream | null>(null);

  const formatTime = (value: string) => new Date(value).toLocaleString();

  const appendLog = (line: string) => {
    setLogs((prev) => [`${new Date().toLocaleTimeString()} ${line}`, ...prev].slice(0, 12));
    setFlash({
      text: line,
      tone: line.includes('失败') ? 'error' : line.includes('完成') || line.includes('成功') || line.includes('已') ? 'success' : 'info'
    });
  };
  const isBusy = (key: string) => !!busy[key];
  const withBusy = async <T,>(key: string, task: () => Promise<T>) => {
    setBusy((prev) => ({ ...prev, [key]: true }));
    try {
      return await task();
    } finally {
      setBusy((prev) => ({ ...prev, [key]: false }));
    }
  };

  const parseJson = <T,>(value: string): T => JSON.parse(value) as T;
  const syncProfileDraft = (nextProfile: ProfileInput) => {
    setProfileDraft(nextProfile);
    setProfileText(JSON.stringify(nextProfile, null, 2));
    setProfileJsonError('');
  };
  const allResumeVersions = resumeGroups.flatMap((group) => group.versions);
  const currentMockQuestion =
    selectedMockInterview?.questions.find((question) => question.id === selectedMockInterview.currentQuestionId) ?? null;
  const latestMockTurn = selectedMockInterview?.turns[selectedMockInterview.turns.length - 1] ?? null;
  const pendingMockEvaluationTurn =
    selectedMockInterview?.turns.find((turn) => turn.evaluation === null && turn.transcript.trim()) ?? null;
  const navigation: ReadonlyArray<WorkspaceNavigationItem> = getWorkspaceNavigation();
  const viewMeta: Record<WorkspaceView, WorkspaceViewMeta> = {
    home: getWorkspaceViewMeta('home'),
    profile: getWorkspaceViewMeta('profile'),
    resumes: getWorkspaceViewMeta('resumes'),
    jobs: getWorkspaceViewMeta('jobs'),
    mock: getWorkspaceViewMeta('mock'),
    applications: getWorkspaceViewMeta('applications'),
    interviews: getWorkspaceViewMeta('interviews'),
    settings: getWorkspaceViewMeta('settings')
  };
  const applicationCount = applications.length || applicationBoard.reduce((sum, column) => sum + column.items.length, 0);
  const activeApplicationCount = applications.filter((application) =>
    ['READY', 'APPLIED', 'SCREENING', 'INTERVIEWING'].includes(application.status)
  ).length;
  const upcomingReminders = selectedApplication?.timeline
    .filter((event) => event.reminderAt)
    .map((event) => ({
      id: event.id,
      title: event.title,
      detail: event.detail,
      reminderAt: event.reminderAt,
      company: selectedApplication.company,
      role: selectedApplication.role
    }))
    .slice(0, 4) ?? [];
  const hasContext =
    (activeView === 'jobs' && !!selectedJobPosting) ||
    (activeView === 'applications' && !!selectedApplication) ||
    (activeView === 'mock' && !!selectedMockInterview) ||
    (activeView === 'resumes' && !!resumeId);
  const latestLog = logs[0] ?? '';
  const latestLogTone = flash?.tone ?? (latestLog.includes('失败')
    ? 'error'
    : latestLog.includes('完成') || latestLog.includes('成功') || latestLog.includes('已')
      ? 'success'
      : 'info');

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const media = window.matchMedia(`(max-width: ${NOTEBOOK_BREAKPOINT}px)`);
    const syncLayout = (matches: boolean) => {
      setIsNotebookLayout(matches);
      if (previousNotebookMatchRef.current === null) {
        previousNotebookMatchRef.current = matches;
        if (matches) setDetailOpen(false);
        return;
      }
      if (matches && previousNotebookMatchRef.current !== matches) {
        setDetailOpen(false);
      }
      previousNotebookMatchRef.current = matches;
    };

    syncLayout(media.matches);
    const handleChange = (event: MediaQueryListEvent) => syncLayout(event.matches);
    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    if (isNotebookLayout && notebookHeavyViews.includes(activeView)) {
      setDetailOpen(false);
    }
  }, [activeView, isNotebookLayout]);

  useEffect(() => {
    if (!isNotebookLayout || !detailOpen || typeof window === 'undefined') return undefined;

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setDetailOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [detailOpen, isNotebookLayout]);

  const onLoadApplications = async (view = applicationView, filters = applicationFilters) => {
    try {
      const params = new URLSearchParams();
      params.set('view', view);
      if (filters.status) params.set('status', filters.status);
      if (filters.company) params.set('company', filters.company);
      if (filters.role) params.set('role', filters.role);
      if (filters.priority) params.set('priority', filters.priority);
      if (filters.q) params.set('q', filters.q);

      if (view === 'board') {
        const data = await callApi<{ columns: ApplicationBoardColumn[] }>(`/api/applications?${params.toString()}`);
        setApplicationBoard(data.columns);
      } else {
        const data = await callApi<{ items: ApplicationCard[] }>(`/api/applications?${params.toString()}`);
        setApplications(data.items);
      }
      appendLog(`已加载投递看板(${view})`);
    } catch (err) {
      appendLog(`读取投递看板失败: ${(err as Error).message}`);
    }
  };

  const onOpenApplication = async (id: string) => {
    try {
      const data = await callApi<ApplicationDetail>(`/api/applications/${id}`);
      setSelectedApplication(data);
      setDetailOpen(true);
      setApplicationInterviewForm({
        roundName: '一面',
        interviewer: '',
        scheduledAt: '',
        status: 'SCREENING',
        notes: '准备围绕岗位要求进行一轮针对性沟通。'
      });
      setApplicationTimelineForm({
        title: '跟进记录',
        detail: '',
        nextStep: '',
        reminderAt: ''
      });
      setInterviewForm((prev) => ({
        ...prev,
        applicationId: data.id,
        jobPostingId: '',
        notes: prev.notes
      }));
      appendLog(`已打开投递详情: ${data.company} · ${data.role}`);
    } catch (err) {
      appendLog(`读取投递详情失败: ${(err as Error).message}`);
    }
  };

  const onLoadResumes = async () => {
    try {
      const data = await callApi<{ groups: ResumeHistoryGroup[] }>('/api/resumes');
      setResumeGroups(data.groups);
      setDiffSelection((prev) => {
        if (prev.baseId && prev.compareId) return prev;
        const versions = data.groups.flatMap((group) => group.versions);
        return {
          baseId: prev.baseId || versions[1]?.id || versions[0]?.id || '',
          compareId: prev.compareId || versions[0]?.id || ''
        };
      });
      appendLog(`已加载 ${data.groups.length} 组简历历史`);
    } catch (err) {
      appendLog(`读取简历列表失败: ${(err as Error).message}`);
    }
  };

  const onLoadJobPostings = async (search = jdSearch, onlySaved = savedOnly) => {
    try {
      const params = new URLSearchParams();
      if (search) params.set('q', search);
      if (onlySaved) params.set('savedOnly', 'true');
      const data = await callApi<JobPostingRecord[]>(`/api/job-postings?${params.toString()}`);
      setJdLibrary(data);
      appendLog(`已加载 ${data.length} 条 JD`);
    } catch (err) {
      appendLog(`读取 JD 列表失败: ${(err as Error).message}`);
    }
  };

  const onLoadInterviews = async (filters = interviewFilters) => {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.set('status', filters.status);
      if (filters.company) params.set('company', filters.company);
      if (filters.role) params.set('role', filters.role);
      const data = await callApi<InterviewRecord[]>(`/api/interviews?${params.toString()}`);
      setInterviews(data);
      appendLog(`已加载 ${data.length} 条面试记录`);
    } catch (err) {
      appendLog(`读取面试记录失败: ${(err as Error).message}`);
    }
  };

  const onLoadMockInterviews = async (filters = mockInterviewFilters) => {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.set('status', filters.status);
      if (filters.q) params.set('q', filters.q);
      const data = await callApi<{ items: MockInterviewListItem[] }>(`/api/mock-interviews?${params.toString()}`);
      setMockInterviewSessions(data.items);
      appendLog(`已加载 ${data.items.length} 场模拟面试`);
    } catch (err) {
      appendLog(`读取模拟面试失败: ${(err as Error).message}`);
    }
  };

  const onOpenMockInterview = async (id: string) => {
    try {
      const data = await callApi<MockInterviewSession>(`/api/mock-interviews/${id}`);
      setSelectedMockInterview(data);
      setDetailOpen(true);
      setMockInterviewSetup((prev) => ({
        ...prev,
        jobPostingId: data.jobPostingId,
        language: data.language,
        targetLevel: data.targetLevel,
        questionCount: data.questionCount as 3 | 5 | 8
      }));
      appendLog(`已打开模拟面试: ${data.company} · ${data.role}`);
    } catch (err) {
      appendLog(`读取模拟面试详情失败: ${(err as Error).message}`);
    }
  };

  const onSelectResumeVersion = async (id: string) => {
    try {
      const data = await callApi<{
        id: string;
        title: string;
        markdown: string;
        theme: ResumeTheme;
        language: Language;
      }>(`/api/resume/${id}`);
      setResumeId(data.id);
      setResumeTitle(data.title);
      setResumeMarkdown(data.markdown);
      setActiveTheme(data.theme);
      setResumeLanguage(data.language);
      setDetailOpen(true);
      appendLog(`已载入历史版本: ${data.id}`);
    } catch (err) {
      appendLog(`载入历史版本失败: ${(err as Error).message}`);
    }
  };

  const onLoadDiff = async () => {
    await withBusy('load-diff', async () => {
      try {
      if (!diffSelection.baseId || !diffSelection.compareId) {
        appendLog('请先选择两个简历版本');
        return;
      }
      const data = await callApi<ResumeDiffPayload>(
        `/api/resume/diff?baseId=${diffSelection.baseId}&compareId=${diffSelection.compareId}`
      );
      setDiffResult(data);
      appendLog('已生成简历版本差异');
      } catch (err) {
      appendLog(`简历版本对比失败: ${(err as Error).message}`);
      }
    });
  };

  useEffect(() => {
    void onLoadResumes();
    void onLoadJobPostings();
    void onLoadInterviews();
    void onLoadApplications();
    void onLoadMockInterviews();
  }, []);

  useEffect(() => {
    return () => {
      mockRecorderStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    if (!flash) return;
    const timeout = window.setTimeout(() => setFlash(null), flash.tone === 'error' ? 6000 : 3600);
    return () => window.clearTimeout(timeout);
  }, [flash]);

  const onValidateKey = async () => {
    await withBusy('validate-key', async () => {
      try {
      const data = await callApi<{
        models: Array<{ name: string; recommended: boolean }>;
        selectedModel: string;
      }>('/api/gemini/validate-key', {
        method: 'POST',
        body: JSON.stringify({ apiKey, selectedModel: selectedModel || undefined })
      });
      setModels(data.models);
      setSelectedModel(data.selectedModel);
      appendLog('Gemini Key 校验成功');
      } catch (err) {
      appendLog(`Key 校验失败: ${(err as Error).message}`);
      }
    });
  };

  const onRefreshModels = async () => {
    try {
      const data = await callApi<{
        models: Array<{ name: string; recommended: boolean }>;
        selectedModel: string;
      }>('/api/gemini/models');
      setModels(data.models);
      setSelectedModel(data.selectedModel);
      appendLog('模型列表刷新完成');
    } catch (err) {
      appendLog(`模型刷新失败: ${(err as Error).message}`);
    }
  };

  const onSaveModel = async () => {
    await withBusy('save-model', async () => {
      try {
      if (!selectedModel) {
        appendLog('请先选择模型');
        return;
      }
      await callApi<{ selectedModel: string }>('/api/gemini/models', {
        method: 'POST',
        body: JSON.stringify({ selectedModel })
      });
      appendLog(`默认模型已保存: ${selectedModel}`);
      } catch (err) {
      appendLog(`模型保存失败: ${(err as Error).message}`);
      }
    });
  };

  const onGenerateResume = async () => {
    await withBusy('generate-resume', async () => {
      try {
      const profile = parseJson<ProfileInput>(profileText);
      profile.language = resumeLanguage;
      const data = await callApi<{ resumeId: string; markdown: string; theme: ResumeTheme }>(
        '/api/resume/generate',
        {
          method: 'POST',
          body: JSON.stringify({ profile, style, theme: activeTheme })
        }
      );
      setResumeId(data.resumeId);
      setResumeTitle(profile.basics.name);
      setResumeMarkdown(data.markdown);
      setActiveTheme(data.theme);
      appendLog(`简历生成完成: ${data.resumeId}`);
      await onLoadResumes();
      } catch (err) {
      appendLog(`生成失败: ${(err as Error).message}`);
      }
    });
  };

  const onApplyProfileJson = () => {
    try {
      const nextProfile = parseJson<ProfileInput>(profileText);
      syncProfileDraft(nextProfile);
      appendLog('已从 JSON 更新个人档案表单');
    } catch (err) {
      setProfileJsonError((err as Error).message);
      appendLog(`Profile JSON 解析失败: ${(err as Error).message}`);
    }
  };

  const onResetProfile = () => {
    syncProfileDraft(DEFAULT_PROFILE);
    appendLog('个人档案已重置为示例内容');
  };

  const onOptimizeResume = async () => {
    await withBusy('optimize-resume', async () => {
      try {
      const jd = parseJson<typeof DEFAULT_JD>(jdText);
      jd.language = resumeLanguage;
      const data = await callApi<{ resumeId: string; markdown: string; diagnosis: unknown; theme: ResumeTheme }>(
        '/api/resume/optimize',
        {
          method: 'POST',
          body: JSON.stringify({ resumeId: resumeId || undefined, resumeMarkdown, jd, theme: activeTheme })
        }
      );
      setResumeId(data.resumeId);
      setResumeTitle(`${jd.company}-${jd.role}-optimized`);
      setResumeMarkdown(data.markdown);
      setActiveTheme(data.theme);
      setOptResult(JSON.stringify(data.diagnosis, null, 2));
      appendLog('简历优化与诊断完成');
      await onLoadResumes();
      await onLoadJobPostings();
      } catch (err) {
      appendLog(`优化失败: ${(err as Error).message}`);
      }
    });
  };

  const onPrepareInterview = async () => {
    await withBusy('prepare-interview', async () => {
      try {
      const jd = parseJson<typeof DEFAULT_JD>(jdText);
      jd.language = resumeLanguage;
      const data = await callApi<{ jobPostingId: string; strategy: string; qa: unknown[] }>(
        '/api/interview/prepare',
        {
          method: 'POST',
          body: JSON.stringify({ jd, targetLevel })
        }
      );
      setInterviewForm((prev) => ({ ...prev, jobPostingId: data.jobPostingId }));
      setPrepResult(JSON.stringify(data, null, 2));
      appendLog(`面试建议已生成: ${data.jobPostingId}`);
      await onLoadJobPostings();
      } catch (err) {
      appendLog(`面试建议生成失败: ${(err as Error).message}`);
      }
    });
  };

  const onSaveCurrentJd = async () => {
    await withBusy('save-current-jd', async () => {
      try {
      const jd = parseJson<typeof DEFAULT_JD>(jdText);
      await callApi<JobPostingRecord>('/api/job-postings', {
        method: 'POST',
        body: JSON.stringify({
          company: jd.company,
          role: jd.role,
          description: jd.description,
          language: resumeLanguage,
          saved: true
        })
      });
      appendLog('JD 已保存到收藏库');
      await onLoadJobPostings();
      } catch (err) {
      appendLog(`JD 保存失败: ${(err as Error).message}`);
      }
    });
  };

  const onCreateApplicationFromJd = async (posting: JobPostingRecord) => {
    await withBusy(`create-application:${posting.id}`, async () => {
      try {
      const created = await callApi<ApplicationCard>('/api/applications', {
        method: 'POST',
        body: JSON.stringify({
          jobPostingId: posting.id,
          resumeId: resumeId || undefined,
          status: 'SAVED',
          priority: 'MEDIUM'
        })
      });
      appendLog(`已创建投递: ${created.company} · ${created.role}`);
      await onLoadApplications();
      await onOpenApplication(created.id);
      } catch (err) {
      appendLog(`创建投递失败: ${(err as Error).message}`);
      }
    });
  };

  const onUpdateApplication = async (
    id: string,
    payload: {
      status?: ApplicationStatus;
      priority?: ApplicationPriority;
      resumeId?: string | null;
      notes?: string;
      source?: string | null;
      appliedAt?: string | null;
    }
  ) => {
    try {
      const updated = await callApi<ApplicationDetail>(`/api/applications/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });
      setSelectedApplication(updated);
      appendLog(`投递已更新: ${updated.company} · ${updated.role}`);
      await onLoadApplications();
    } catch (err) {
      appendLog(`更新投递失败: ${(err as Error).message}`);
    }
  };

  const onMoveApplicationByDrag = async (application: ApplicationCard, status: ApplicationStatus) => {
    if (application.status === status) {
      setDraggingApplicationId('');
      setDragTargetStatus('');
      return;
    }

    await onUpdateApplication(application.id, {
      status,
      appliedAt: status === 'APPLIED' ? application.appliedAt ?? new Date().toISOString() : application.appliedAt
    });
    appendLog(`已拖动投递到 ${status}: ${application.company} · ${application.role}`);
    setDraggingApplicationId('');
    setDragTargetStatus('');
  };

  const onDeleteApplication = async (application: ApplicationCard | ApplicationDetail) => {
    setConfirmDialog({
      title: '删除投递记录',
      description: `确认删除 “${application.company} · ${application.role}” 吗？如果已经有关联面试，系统会阻止删除。`,
      confirmLabel: '确认删除',
      tone: 'danger',
      busyKey: `delete-application:${application.id}`,
      onConfirm: async () => {
        await withBusy(`delete-application:${application.id}`, async () => {
          try {
            await callApi<{ deleted: boolean }>(`/api/applications/${application.id}`, {
              method: 'DELETE'
            });
            if (selectedApplication?.id === application.id) {
              setSelectedApplication(null);
            }
            appendLog(`投递已删除: ${application.company} · ${application.role}`);
            await onLoadApplications();
            setConfirmDialog(null);
          } catch (err) {
            appendLog(`删除投递失败: ${(err as Error).message}`);
          }
        });
      }
    });
  };

  const onLoadJobPostingIntoEditor = (posting: JobPostingRecord) => {
    setSelectedJobPosting(posting);
    setJdText(
      JSON.stringify(
        {
          company: posting.company,
          role: posting.role,
          description: posting.description,
          language: posting.language
        },
        null,
        2
      )
    );
    setResumeLanguage(posting.language);
    appendLog(`已载入 JD: ${posting.company} · ${posting.role}`);
  };

  const onOptimizeWithJobPosting = async (posting: JobPostingRecord) => {
    setSelectedJobPosting(posting);
    setResumeLanguage(posting.language);
    setJdText(
      JSON.stringify(
        {
          company: posting.company,
          role: posting.role,
          description: posting.description,
          language: posting.language
        },
        null,
        2
      )
    );

    if (!resumeId && !resumeMarkdown.trim()) {
      appendLog('请先生成或载入一份简历，再使用 JD 快捷优化');
      return;
    }

    try {
      const data = await callApi<{ resumeId: string; markdown: string; diagnosis: unknown; theme: ResumeTheme }>(
        '/api/resume/optimize',
        {
          method: 'POST',
          body: JSON.stringify({
            resumeId: resumeId || undefined,
            resumeMarkdown,
            jd: {
              company: posting.company,
              role: posting.role,
              description: posting.description,
              language: posting.language
            },
            theme: activeTheme
          })
        }
      );
      setResumeId(data.resumeId);
      setResumeTitle(`${posting.company}-${posting.role}-optimized`);
      setResumeMarkdown(data.markdown);
      setActiveTheme(data.theme);
      setResumeLanguage(posting.language);
      setOptResult(JSON.stringify(data.diagnosis, null, 2));
      appendLog(`已基于 JD 快捷优化简历: ${posting.company} · ${posting.role}`);
      await onLoadResumes();
      await onLoadJobPostings();
    } catch (err) {
      appendLog(`JD 快捷优化失败: ${(err as Error).message}`);
    }
  };

  const onPrepareInterviewWithJobPosting = async (posting: JobPostingRecord) => {
    setSelectedJobPosting(posting);
    setResumeLanguage(posting.language);
    setJdText(
      JSON.stringify(
        {
          company: posting.company,
          role: posting.role,
          description: posting.description,
          language: posting.language
        },
        null,
        2
      )
    );

    try {
      const data = await callApi<{ jobPostingId: string; strategy: string; qa: unknown[] }>(
        '/api/interview/prepare',
        {
          method: 'POST',
          body: JSON.stringify({
            jobPostingId: posting.id,
            jd: {
              company: posting.company,
              role: posting.role,
              description: posting.description,
              language: posting.language
            },
            targetLevel
          })
        }
      );
      setInterviewForm((prev) => ({ ...prev, jobPostingId: data.jobPostingId }));
      setPrepResult(JSON.stringify(data, null, 2));
      appendLog(`已基于 JD 快捷生成面试建议: ${posting.company} · ${posting.role}`);
    } catch (err) {
      appendLog(`JD 快捷生成面试建议失败: ${(err as Error).message}`);
    }
  };

  const blobToBase64 = async (blob: Blob) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result;
        if (typeof result !== 'string') {
          reject(new Error('读取音频失败'));
          return;
        }
        resolve(result.split(',')[1] ?? '');
      };
      reader.onerror = () => reject(reader.error ?? new Error('读取音频失败'));
      reader.readAsDataURL(blob);
    });

  const onStartMockInterview = async (payload?: {
    jobPostingId?: string;
    jd?: { company: string; role: string; description: string; language?: Language };
  }) => {
    await withBusy('start-mock-interview', async () => {
      try {
      const body =
        payload ??
        (mockInterviewSetup.jobPostingId
          ? {
              jobPostingId: mockInterviewSetup.jobPostingId,
              language: mockInterviewSetup.language,
              targetLevel: mockInterviewSetup.targetLevel,
              questionCount: mockInterviewSetup.questionCount
            }
          : {
              jd: parseJson<typeof DEFAULT_JD>(jdText),
              language: mockInterviewSetup.language,
              targetLevel: mockInterviewSetup.targetLevel,
              questionCount: mockInterviewSetup.questionCount
            });

      const data = await callApi<{
        sessionId: string;
        questions: MockInterviewQuestion[];
        currentQuestion: MockInterviewQuestion | null;
      }>('/api/mock-interviews', {
        method: 'POST',
        body: JSON.stringify({
          ...body,
          targetLevel: mockInterviewSetup.targetLevel,
          language: mockInterviewSetup.language,
          questionCount: mockInterviewSetup.questionCount
        })
      });
      appendLog(`模拟面试已开始，共 ${data.questions.length} 题`);
      await onLoadMockInterviews();
      await onOpenMockInterview(data.sessionId);
      } catch (err) {
      appendLog(`启动模拟面试失败: ${(err as Error).message}`);
      }
    });
  };

  const onStartMockInterviewWithJobPosting = async (posting: JobPostingRecord) => {
    setMockInterviewSetup((prev) => ({
      ...prev,
      jobPostingId: posting.id,
      language: posting.language
    }));
    await onStartMockInterview({
      jobPostingId: posting.id,
      jd: {
        company: posting.company,
        role: posting.role,
        description: posting.description,
        language: posting.language
      }
    });
  };

  const onStartMockInterviewWithApplication = async (application: ApplicationDetail) => {
    await onStartMockInterview({
      jd: {
        company: application.company,
        role: application.role,
        description: application.description,
        language: application.language
      }
    });
  };

  const onFinalizeMockInterview = async (sessionId: string) => {
    try {
      await callApi<MockInterviewSession>(`/api/mock-interviews/${sessionId}/complete`, {
        method: 'POST',
        body: JSON.stringify({})
      });
      appendLog('模拟面试总评已生成');
      await onLoadMockInterviews();
      await onOpenMockInterview(sessionId);
    } catch (err) {
      appendLog(`生成模拟面试总评失败: ${(err as Error).message}`);
    }
  };

  const onSubmitMockInterviewAnswer = async (questionId: string, blob?: Blob, retryEvaluation = false) => {
    try {
      if (!selectedMockInterview) {
        appendLog('请先选择一场模拟面试');
        return;
      }

      setIsSubmittingMockTurn(true);
      const payload: Record<string, unknown> = { questionId, retryEvaluation };
      if (!retryEvaluation && blob) {
        payload.audioBase64 = await blobToBase64(blob);
        payload.mimeType = blob.type || 'audio/webm';
        payload.durationSec = Math.max(1, Math.round(blob.size / 16000));
      }

      const data = await callApi<{
        transcript: string;
        evaluation: MockInterviewEvaluation;
        nextQuestion: MockInterviewQuestion | null;
        completed: boolean;
      }>(`/api/mock-interviews/${selectedMockInterview.id}/turns`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      appendLog(`模拟面试回答已提交，本题得分 ${data.evaluation.score}`);
      await onOpenMockInterview(selectedMockInterview.id);
      await onLoadMockInterviews();
      if (data.completed) {
        await onFinalizeMockInterview(selectedMockInterview.id);
      }
    } catch (err) {
      appendLog(`提交模拟面试答案失败: ${(err as Error).message}`);
      if (selectedMockInterview) {
        await onOpenMockInterview(selectedMockInterview.id);
      }
    } finally {
      setIsSubmittingMockTurn(false);
    }
  };

  const onToggleMockInterviewRecording = async () => {
    try {
      if (!currentMockQuestion || !selectedMockInterview) {
        appendLog('当前没有可作答的题目');
        return;
      }

      if (isRecordingMockInterview) {
        mockRecorderRef.current?.stop();
        setIsRecordingMockInterview(false);
        return;
      }

      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
        appendLog('当前浏览器不支持录音');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mockRecorderStreamRef.current = stream;
      mockRecorderChunksRef.current = [];
      const questionId = currentMockQuestion.id;
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : '';
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mockRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          mockRecorderChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const finalMimeType = recorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(mockRecorderChunksRef.current, { type: finalMimeType });
        mockRecorderChunksRef.current = [];
        mockRecorderStreamRef.current?.getTracks().forEach((track) => track.stop());
        mockRecorderStreamRef.current = null;
        void onSubmitMockInterviewAnswer(questionId, audioBlob);
      };

      recorder.start();
      setIsRecordingMockInterview(true);
      appendLog(`开始录制模拟面试回答: 第 ${currentMockQuestion.order} 题`);
    } catch (err) {
      appendLog(`启动录音失败: ${(err as Error).message}`);
      setIsRecordingMockInterview(false);
    }
  };

  const onSaveMockInterviewToTracker = async () => {
    try {
      if (!selectedMockInterview?.summary) {
        appendLog('请先完成一场模拟面试并生成总结');
        return;
      }

      await callApi('/api/interviews', {
        method: 'POST',
        body: JSON.stringify({
          jobPostingId: selectedMockInterview.jobPostingId,
          roundName: '模拟面试',
          status: 'TECHNICAL',
          notes: `模拟面试总分: ${selectedMockInterview.summary.overallScore}\n亮点: ${selectedMockInterview.summary.topStrengths.join('；')}\n风险: ${selectedMockInterview.summary.topRisks.join('；')}\n建议复习: ${selectedMockInterview.summary.recommendedTopics.join('；')}`
        })
      });
      appendLog('模拟面试结果已沉淀到 Interview Tracker');
      await onLoadInterviews();
    } catch (err) {
      appendLog(`保存模拟面试结果失败: ${(err as Error).message}`);
    }
  };

  const onOpenJobPostingDetail = async (id: string) => {
    try {
      const posting = await callApi<JobPostingRecord>(`/api/job-postings/${id}`);
      setSelectedJobPosting(posting);
      setDetailOpen(true);
      appendLog(`已打开 JD 详情: ${posting.company} · ${posting.role}`);
    } catch (err) {
      appendLog(`打开 JD 详情失败: ${(err as Error).message}`);
    }
  };

  const onToggleSavedJobPosting = async (posting: JobPostingRecord) => {
    try {
      await callApi<JobPostingRecord>(`/api/job-postings/${posting.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ saved: !posting.saved })
      });
      appendLog(posting.saved ? 'JD 已取消收藏' : 'JD 已收藏');
      await onLoadJobPostings();
    } catch (err) {
      appendLog(`更新 JD 收藏状态失败: ${(err as Error).message}`);
    }
  };

  const onDeleteJobPosting = async (posting: JobPostingRecord) => {
    setConfirmDialog({
      title: '删除 JD',
      description: `确认删除 “${posting.company} · ${posting.role}” 吗？如果它已经关联面试记录，系统会阻止删除。`,
      confirmLabel: '确认删除',
      tone: 'danger',
      busyKey: `delete-job:${posting.id}`,
      onConfirm: async () => {
        await withBusy(`delete-job:${posting.id}`, async () => {
          try {
            await callApi<{ deleted: boolean }>(`/api/job-postings/${posting.id}`, {
              method: 'DELETE'
            });
            if (selectedJobPosting?.id === posting.id) {
              setSelectedJobPosting(null);
            }
            appendLog(`JD 已删除: ${posting.company} · ${posting.role}`);
            await onLoadJobPostings();
            setConfirmDialog(null);
          } catch (err) {
            appendLog(`删除 JD 失败: ${(err as Error).message}`);
          }
        });
      }
    });
  };

  const onSaveJobPostingDetail = async () => {
    await withBusy('save-job-detail', async () => {
      try {
      if (!selectedJobPosting) {
        appendLog('请先选择一条 JD');
        return;
      }
      const updated = await callApi<JobPostingRecord>(`/api/job-postings/${selectedJobPosting.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          company: selectedJobPosting.company,
          role: selectedJobPosting.role,
          description: selectedJobPosting.description,
          language: selectedJobPosting.language,
          saved: selectedJobPosting.saved
        })
      });
      setSelectedJobPosting(updated);
      appendLog('JD 详情已保存');
      await onLoadJobPostings();
      } catch (err) {
      appendLog(`保存 JD 详情失败: ${(err as Error).message}`);
      }
    });
  };

  const onRenameResume = async () => {
    await withBusy('rename-resume', async () => {
      try {
      if (!resumeId || !resumeTitle.trim()) {
        appendLog('请先载入一个简历并填写标题');
        return;
      }
      await callApi<{ id: string; title: string }>(`/api/resume/${resumeId}`, {
        method: 'PATCH',
        body: JSON.stringify({ title: resumeTitle.trim() })
      });
      appendLog('简历标题已更新');
      await onLoadResumes();
      } catch (err) {
      appendLog(`简历重命名失败: ${(err as Error).message}`);
      }
    });
  };

  const onSaveResumeContent = async () => {
    await withBusy('save-resume-content', async () => {
      try {
        if (!resumeId || !resumeMarkdown.trim()) {
          appendLog('请先载入一份简历并补充正文');
          return;
        }
        const data = await callApi<{ id: string; title: string; markdown: string }>(`/api/resume/${resumeId}`, {
          method: 'PATCH',
          body: JSON.stringify({
            title: resumeTitle.trim() || undefined,
            markdown: resumeMarkdown
          })
        });
        setResumeTitle(data.title);
        setResumeMarkdown(data.markdown);
        appendLog('简历正文已保存');
        await onLoadResumes();
      } catch (err) {
        appendLog(`保存简历正文失败: ${(err as Error).message}`);
      }
    });
  };

  const onImportResumeFile = async (file: File) => {
    await withBusy('preview-resume-import', async () => {
      try {
        const formData = new FormData();
        formData.set('file', file);
        formData.set('theme', activeTheme);
        formData.set('language', resumeLanguage);

        const response = await fetch('/api/resume/import/preview', {
          method: 'POST',
          body: formData
        });
        const json = (await response.json()) as {
          success: boolean;
          data?: ResumeImportPreview;
          error?: string;
        };
        if (!json.success || !json.data) {
          throw new Error(json.error ?? '导入失败');
        }

        setResumeImportPreview(json.data);
        setActiveView('resumes');
        setDetailOpen(true);
        appendLog(`已识别导入预览: ${file.name}`);
      } catch (err) {
        appendLog(`简历导入失败: ${(err as Error).message}`);
      }
    });
  };

  const onChangeResumeImportPreview = (patch: Partial<ResumeImportPreview>) => {
    setResumeImportPreview((prev) => (prev ? { ...prev, ...patch } : prev));
  };

  const onConfirmResumeImport = async () => {
    await withBusy('confirm-resume-import', async () => {
      try {
        if (!resumeImportPreview) {
          appendLog('当前没有可确认的导入预览');
          return;
        }

        const data = await callApi<{
          resumeId: string;
          profileId: string;
          title: string;
          markdown: string;
          theme: ResumeTheme;
          draft: unknown;
          profile: ProfileInput;
        }>('/api/resume/import', {
          method: 'POST',
          body: JSON.stringify(resumeImportPreview)
        });

        setResumeId(data.resumeId);
        setResumeTitle(data.title);
        setResumeMarkdown(data.markdown);
        setActiveTheme(data.theme);
        setResumeLanguage(resumeImportPreview.language);
        syncProfileDraft(data.profile);
        setResumeImportPreview(null);
        setActiveView('resumes');
        setDetailOpen(true);
        appendLog(`简历导入完成: ${data.title}`);
        await onLoadResumes();
      } catch (err) {
        appendLog(`确认导入失败: ${(err as Error).message}`);
      }
    });
  };

  const onCancelResumeImport = () => {
    setResumeImportPreview(null);
    appendLog('已取消本次简历导入预览');
  };

  const onDeleteResume = async (id: string) => {
    const version = allResumeVersions.find((item) => item.id === id);
    setConfirmDialog({
      title: '删除简历版本',
      description: `确认删除 ${version ? `V${version.version}` : id} 吗？如果它有子版本，系统会自动保持版本链连续。`,
      confirmLabel: '确认删除',
      tone: 'danger',
      busyKey: `delete-resume:${id}`,
      onConfirm: async () => {
        await withBusy(`delete-resume:${id}`, async () => {
          try {
            await callApi<{ deleted: boolean }>(`/api/resume/${id}`, {
              method: 'DELETE'
            });
            if (resumeId === id) {
              setResumeId('');
              setResumeTitle('');
              setResumeMarkdown('');
            }
            if (diffSelection.baseId === id || diffSelection.compareId === id) {
              setDiffSelection({ baseId: '', compareId: '' });
              setDiffResult(null);
            }
            appendLog(`简历版本已删除: ${id}`);
            await onLoadResumes();
            setConfirmDialog(null);
          } catch (err) {
            appendLog(`删除简历失败: ${(err as Error).message}`);
          }
        });
      }
    });
  };

  const onCreateInterview = async () => {
    await withBusy('create-interview', async () => {
      try {
      await callApi('/api/interviews', {
        method: 'POST',
        body: JSON.stringify(interviewForm)
      });
      appendLog('面试记录已创建');
      await onLoadInterviews();
      await onLoadApplications();
      if (interviewForm.applicationId) {
        await onOpenApplication(interviewForm.applicationId);
      }
      } catch (err) {
      appendLog(`面试记录创建失败: ${(err as Error).message}`);
      }
    });
  };

  const onCreateInterviewFromApplication = async () => {
    await withBusy('create-application-interview', async () => {
      try {
      if (!selectedApplication) {
        appendLog('请先打开一条投递详情');
        return;
      }

      await callApi('/api/interviews', {
        method: 'POST',
        body: JSON.stringify({
          applicationId: selectedApplication.id,
          roundName: applicationInterviewForm.roundName,
          interviewer: applicationInterviewForm.interviewer || undefined,
          scheduledAt: applicationInterviewForm.scheduledAt
            ? new Date(applicationInterviewForm.scheduledAt).toISOString()
            : undefined,
          status: applicationInterviewForm.status,
          notes: applicationInterviewForm.notes
        })
      });

      appendLog(`已在投递详情中创建面试: ${selectedApplication.company} · ${selectedApplication.role}`);
      await onLoadInterviews();
      await onLoadApplications();
      await onOpenApplication(selectedApplication.id);
      } catch (err) {
      appendLog(`投递详情创建面试失败: ${(err as Error).message}`);
      }
    });
  };

  const onAddTimelineNote = async () => {
    await withBusy('add-timeline-note', async () => {
      try {
      if (!selectedApplication) {
        appendLog('请先打开一条投递详情');
        return;
      }

      if (!applicationTimelineForm.detail.trim()) {
        appendLog('请先填写跟进备注内容');
        return;
      }

      await callApi(`/api/applications/${selectedApplication.id}`, {
        method: 'POST',
        body: JSON.stringify({
          title: applicationTimelineForm.title.trim() || undefined,
          detail: applicationTimelineForm.detail.trim(),
          nextStep: applicationTimelineForm.nextStep.trim() || undefined,
          reminderAt: applicationTimelineForm.reminderAt
            ? new Date(applicationTimelineForm.reminderAt).toISOString()
            : undefined
        })
      });

      appendLog(`已添加时间线备注: ${selectedApplication.company} · ${selectedApplication.role}`);
      setApplicationTimelineForm({
        title: '跟进记录',
        detail: '',
        nextStep: '',
        reminderAt: ''
      });
      await onLoadApplications();
      await onOpenApplication(selectedApplication.id);
      } catch (err) {
      appendLog(`添加时间线备注失败: ${(err as Error).message}`);
      }
    });
  };

  const onUpdateInterviewStatus = async (id: string, status: InterviewRecord['status']) => {
    try {
      await callApi(`/api/interviews/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      appendLog(`面试状态已更新为 ${status}`);
      await onLoadInterviews();
      await onLoadApplications();
    } catch (err) {
      appendLog(`更新面试状态失败: ${(err as Error).message}`);
    }
  };

  const onGenSummary = async (id: string) => {
    try {
      await callApi(`/api/interviews/${id}/summary`, {
        method: 'POST',
        body: JSON.stringify({})
      });
      appendLog('面试复盘总结已生成');
      await onLoadInterviews();
      await onLoadApplications();
      if (selectedApplication) {
        await onOpenApplication(selectedApplication.id);
      }
    } catch (err) {
      appendLog(`复盘失败: ${(err as Error).message}`);
    }
  };

  const onApplyTheme = async (theme: ResumeTheme) => {
    setActiveTheme(theme);
    if (!resumeId) {
      appendLog(`已切换主题预设: ${theme}`);
      return;
    }

    try {
      const data = await callApi<{ markdown: string; theme: ResumeTheme }>(`/api/resume/${resumeId}/theme`, {
        method: 'POST',
        body: JSON.stringify({ theme })
      });
      setResumeMarkdown(data.markdown);
      setActiveTheme(data.theme);
      appendLog(`简历主题已更新: ${theme}`);
      await onLoadResumes();
    } catch (err) {
      appendLog(`主题更新失败: ${(err as Error).message}`);
    }
  };

  const onLogout = () => {
    startTransition(async () => {
      await signOut({ callbackUrl: '/auth' });
    });
  };

  const detailPanel = (() => {
    if (activeView === 'jobs' && selectedJobPosting) {
      return {
        title: 'JD 详情',
        body: (
          <>
            <div className="detail-stat">
              <strong>{selectedJobPosting.company}</strong>
              <span>{selectedJobPosting.role}</span>
            </div>
            <div className="small">{selectedJobPosting.language} · {selectedJobPosting.saved ? '已收藏' : '未收藏'}</div>
            <label>JD 公司</label>
            <input
              value={selectedJobPosting.company}
              onChange={(e) => setSelectedJobPosting((prev) => (prev ? { ...prev, company: e.target.value } : prev))}
            />
            <label>JD 岗位</label>
            <input
              value={selectedJobPosting.role}
              onChange={(e) => setSelectedJobPosting((prev) => (prev ? { ...prev, role: e.target.value } : prev))}
            />
            <label>JD 语言</label>
            <select
              value={selectedJobPosting.language}
              onChange={(e) =>
                setSelectedJobPosting((prev) => (prev ? { ...prev, language: e.target.value as Language } : prev))
              }
            >
              <option value="zh-CN">中文</option>
              <option value="en-US">English</option>
            </select>
            <label>JD 描述</label>
            <textarea
              className="detail-textarea"
              value={selectedJobPosting.description}
              onChange={(e) =>
                setSelectedJobPosting((prev) => (prev ? { ...prev, description: e.target.value } : prev))
              }
            />
            <div className="detail-actions">
              <button onClick={() => void onSaveJobPostingDetail()} disabled={isBusy('save-job-detail')}>
                {isBusy('save-job-detail') ? '保存中...' : '保存 JD 详情'}
              </button>
              <button className="secondary" onClick={() => onLoadJobPostingIntoEditor(selectedJobPosting)}>
                载入编辑器
              </button>
              <button className="danger" onClick={() => void onDeleteJobPosting(selectedJobPosting)}>
                删除 JD
              </button>
            </div>
          </>
        )
      };
    }
    if (activeView === 'applications' && selectedApplication) {
      return {
        title: '投递上下文',
        body: (
          <>
            <div className="detail-stat">
              <strong>{selectedApplication.company}</strong>
              <span>{selectedApplication.role}</span>
            </div>
            <div className="small">
              {selectedApplication.status} · {selectedApplication.priority} · {selectedApplication.resumeLabel ?? '未绑定简历'}
            </div>
            <div className="small">最近变更 {formatTime(selectedApplication.updatedAt)}</div>
            <label>投递状态</label>
            <select
              value={selectedApplication.status}
              onChange={(e) =>
                setSelectedApplication((prev) => (prev ? { ...prev, status: e.target.value as ApplicationStatus } : prev))
              }
            >
              {applicationStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            <label>优先级</label>
            <select
              value={selectedApplication.priority}
              onChange={(e) =>
                setSelectedApplication((prev) =>
                  prev ? { ...prev, priority: e.target.value as ApplicationPriority } : prev
                )
              }
            >
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
            </select>
            <label>绑定简历版本</label>
            <select
              value={selectedApplication.resumeId ?? ''}
              onChange={(e) =>
                setSelectedApplication((prev) => (prev ? { ...prev, resumeId: e.target.value || null } : prev))
              }
            >
              <option value="">不绑定</option>
              {allResumeVersions.map((version) => (
                <option key={version.id} value={version.id}>
                  V{version.version} · {version.targetLabel ?? version.title}
                </option>
              ))}
            </select>
            <label>投递渠道</label>
            <input
              value={selectedApplication.source ?? ''}
              onChange={(e) =>
                setSelectedApplication((prev) => (prev ? { ...prev, source: e.target.value || null } : prev))
              }
            />
            <label>投递备注</label>
            <textarea
              className="detail-textarea"
              value={selectedApplication.notes}
              onChange={(e) => setSelectedApplication((prev) => (prev ? { ...prev, notes: e.target.value } : prev))}
            />
            <div className="detail-actions">
              <button
                disabled={isBusy('save-application-detail')}
                onClick={() =>
                  void withBusy('save-application-detail', async () => {
                    await onUpdateApplication(selectedApplication.id, {
                      status: selectedApplication.status,
                      priority: selectedApplication.priority,
                      resumeId: selectedApplication.resumeId,
                      source: selectedApplication.source,
                      notes: selectedApplication.notes,
                      appliedAt:
                        selectedApplication.status === 'APPLIED'
                          ? selectedApplication.appliedAt ?? new Date().toISOString()
                          : selectedApplication.appliedAt
                    });
                  })
                }
              >
                {isBusy('save-application-detail') ? '保存中...' : '保存投递详情'}
              </button>
              <button className="warn" onClick={() => void onStartMockInterviewWithApplication(selectedApplication)}>
                发起模拟面试
              </button>
            </div>
            <div className="detail-divider" />
            <div className="detail-subtitle">时间线</div>
            <div className="detail-scroll-list">
              {selectedApplication.timeline.map((event) => (
                <div key={event.id} className="detail-note">
                  <strong>{event.title}</strong>
                  <div className="small">{event.detail}</div>
                  {event.nextStep ? <div className="timeline-tag">下一步: {event.nextStep}</div> : null}
                  {event.reminderAt ? (
                    <div className="timeline-tag timeline-tag-warn">
                      提醒: {new Date(event.reminderAt).toLocaleString()}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
            <div className="detail-divider" />
            <div className="detail-subtitle">新增跟进</div>
            <label>标题</label>
            <input
              value={applicationTimelineForm.title}
              onChange={(e) => setApplicationTimelineForm((prev) => ({ ...prev, title: e.target.value }))}
            />
            <label>备注</label>
            <textarea
              className="detail-textarea"
              value={applicationTimelineForm.detail}
              onChange={(e) => setApplicationTimelineForm((prev) => ({ ...prev, detail: e.target.value }))}
            />
            <label>下一步行动</label>
            <input
              value={applicationTimelineForm.nextStep}
              onChange={(e) => setApplicationTimelineForm((prev) => ({ ...prev, nextStep: e.target.value }))}
            />
            <label>提醒日期</label>
            <input
              type="datetime-local"
              value={applicationTimelineForm.reminderAt}
              onChange={(e) => setApplicationTimelineForm((prev) => ({ ...prev, reminderAt: e.target.value }))}
            />
            <button className="secondary" onClick={() => void onAddTimelineNote()} disabled={isBusy('add-timeline-note')}>
              {isBusy('add-timeline-note') ? '保存中...' : '保存跟进记录'}
            </button>
            <div className="detail-divider" />
            <div className="detail-subtitle">快速创建面试</div>
            <label>轮次</label>
            <input
              value={applicationInterviewForm.roundName}
              onChange={(e) => setApplicationInterviewForm((prev) => ({ ...prev, roundName: e.target.value }))}
            />
            <label>备注</label>
            <textarea
              className="detail-textarea"
              value={applicationInterviewForm.notes}
              onChange={(e) => setApplicationInterviewForm((prev) => ({ ...prev, notes: e.target.value }))}
            />
            <button className="secondary" onClick={() => void onCreateInterviewFromApplication()} disabled={isBusy('create-application-interview')}>
              {isBusy('create-application-interview') ? '保存中...' : '保存到该投递'}
            </button>
          </>
        )
      };
    }
    if (activeView === 'mock' && selectedMockInterview) {
      return {
        title: '会话摘要',
        body: (
          <>
            <div className="detail-stat">
              <strong>{selectedMockInterview.company}</strong>
              <span>{selectedMockInterview.role}</span>
            </div>
            <div className="small">
              {selectedMockInterview.status} · 已完成 {selectedMockInterview.turns.length}/{selectedMockInterview.questionCount} 题
            </div>
            <div className="small">
              {selectedMockInterview.summary ? `总分 ${selectedMockInterview.summary.overallScore}` : '尚未生成总评'}
            </div>
          </>
        )
      };
    }
    if (activeView === 'resumes' && resumeId) {
      return {
        title: '当前简历',
        body: (
          <>
            <div className="detail-stat">
              <strong>{resumeTitle || '未命名简历'}</strong>
              <span>{resumeId}</span>
            </div>
            <div className="small">
              主题 {activeTheme} · 输出语言 {resumeLanguage === 'zh-CN' ? '中文' : 'English'}
            </div>
            <div className="small">{resumeMarkdown ? `${resumeMarkdown.length} 字符` : '暂无正文'}</div>
          </>
        )
      };
    }
    return {
      title: '工作区提示',
      body: (
        <>
          <div className="detail-note">
            <strong>当前建议</strong>
            <div className="small">先在左侧选择当前任务，再在主工作区专注完成该流程。</div>
          </div>
          <div className="detail-note">
            <strong>最近状态</strong>
            <div className="small">{logs[0] ?? 'Ready'}</div>
          </div>
        </>
      )
    };
  })();

  return (
    <main
      className={[
        'workspace-shell',
        detailOpen ? 'workspace-shell-detail-open' : 'workspace-shell-detail-collapsed',
        isNotebookLayout ? 'workspace-shell-notebook' : ''
      ].join(' ')}
    >
      <Sidebar
        activeView={activeView}
        sidebarOpen={sidebarOpen}
        navigation={navigation}
        user={user}
        onSelect={(view) => {
          setActiveView(view);
          setSidebarOpen(false);
        }}
      />

      <div className="workspace-main">
        <Topbar
          activeView={activeView}
          viewMeta={viewMeta}
          user={user}
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
          contextOpen={detailOpen}
          contextAvailable={hasContext}
          onToggleContext={() => setDetailOpen((prev) => (hasContext ? !prev : prev))}
          onLogout={onLogout}
        />

        {latestLog ? (
          <div className={`workspace-feedback workspace-feedback-${latestLogTone}`}>
            <strong>{latestLogTone === 'error' ? '操作提示' : latestLogTone === 'success' ? '已完成' : '状态更新'}</strong>
            <span>{latestLog}</span>
          </div>
        ) : null}

        {activeView === 'home' ? (
          <HomeView
            resumeGroupCount={resumeGroups.length}
            jdCount={jdLibrary.length}
            applicationCount={applicationCount}
            activeApplicationCount={activeApplicationCount}
            mockInterviewCount={mockInterviewSessions.length}
            interviewCount={interviews.length}
            upcomingReminders={upcomingReminders}
            logs={logs}
            recentApplications={applications.slice(0, 4)}
            recentMockInterviews={mockInterviewSessions.slice(0, 4)}
            recentInterviews={interviews.slice(0, 4)}
            onGoResumes={() => setActiveView('resumes')}
            onGoJobs={() => setActiveView('jobs')}
            onGoMock={() => setActiveView('mock')}
            onOpenApplication={(id) => {
              setActiveView('applications');
              void onOpenApplication(id);
            }}
            onOpenMockInterview={(id) => {
              setActiveView('mock');
              void onOpenMockInterview(id);
            }}
          />
        ) : null}

        {activeView === 'profile' ? (
          <ProfileView
            profile={profileDraft}
            profileText={profileText}
            showProfileJson={showProfileJson}
            profileJsonError={profileJsonError}
            resumeLanguage={resumeLanguage}
            style={style}
            targetLevel={targetLevel}
            onResumeLanguageChange={setResumeLanguage}
            onStyleChange={setStyle}
            onTargetLevelChange={setTargetLevel}
            onProfileChange={syncProfileDraft}
            onProfileTextChange={(value) => {
              setProfileText(value);
              setProfileJsonError('');
            }}
            onToggleProfileJson={() => setShowProfileJson((prev) => !prev)}
            onApplyProfileJson={onApplyProfileJson}
            onResetProfile={onResetProfile}
            onGenerateResume={onGenerateResume}
            onGoResumes={() => setActiveView('resumes')}
            isGeneratingResume={isBusy('generate-resume')}
          />
        ) : null}

        {activeView === 'resumes' ? (
          <ResumesView
            resumeId={resumeId}
            resumeTitle={resumeTitle}
            resumeMarkdown={resumeMarkdown}
            activeTheme={activeTheme}
            allResumeVersions={allResumeVersions}
            resumeGroups={resumeGroups}
            diffSelection={diffSelection}
            diffResult={diffResult}
            onResumeTitleChange={setResumeTitle}
            onResumeMarkdownChange={setResumeMarkdown}
            onGenerateResume={onGenerateResume}
            onOptimizeResume={onOptimizeResume}
            onRenameResume={onRenameResume}
            onSaveResumeContent={onSaveResumeContent}
            onImportResumeFile={(file) => void onImportResumeFile(file)}
            onApplyTheme={onApplyTheme}
            onSelectResumeVersion={(id) => void onSelectResumeVersion(id)}
            onDeleteResume={(id) => void onDeleteResume(id)}
            onDiffSelectionChange={setDiffSelection}
            onLoadDiff={() => void onLoadDiff()}
            isGeneratingResume={isBusy('generate-resume')}
            isOptimizingResume={isBusy('optimize-resume')}
            isRenamingResume={isBusy('rename-resume')}
            isSavingResumeContent={isBusy('save-resume-content')}
            isImportingResumeFile={isBusy('preview-resume-import')}
            resumeImportPreview={resumeImportPreview}
            onChangeResumeImportPreview={onChangeResumeImportPreview}
            onConfirmResumeImport={() => void onConfirmResumeImport()}
            onCancelResumeImport={onCancelResumeImport}
            isConfirmingResumeImport={isBusy('confirm-resume-import')}
            isLoadingDiff={isBusy('load-diff')}
          />
        ) : null}

        {activeView === 'jobs' ? (
          <JobsView
            jdText={jdText}
            optResult={optResult}
            prepResult={prepResult}
            jdSearch={jdSearch}
            savedOnly={savedOnly}
            jdLibrary={jdLibrary}
            selectedJobPosting={selectedJobPosting}
            onJdTextChange={setJdText}
            onJdSearchChange={setJdSearch}
            onToggleSavedOnly={() => setSavedOnly((prev) => !prev)}
            onSearch={() => void onLoadJobPostings(jdSearch, savedOnly)}
            onOptimizeResume={onOptimizeResume}
            onPrepareInterview={onPrepareInterview}
            onSaveCurrentJd={onSaveCurrentJd}
            onCreateApplicationFromJd={(posting) => void onCreateApplicationFromJd(posting)}
            onStartMockInterviewWithJobPosting={(posting) => void onStartMockInterviewWithJobPosting(posting)}
            onOpenJobPostingDetail={(id) => void onOpenJobPostingDetail(id)}
            onToggleSavedJobPosting={(posting) => void onToggleSavedJobPosting(posting)}
            onOptimizeWithJobPosting={(posting) => void onOptimizeWithJobPosting(posting)}
            onPrepareInterviewWithJobPosting={(posting) => void onPrepareInterviewWithJobPosting(posting)}
            isOptimizingResume={isBusy('optimize-resume')}
            isPreparingInterview={isBusy('prepare-interview')}
            isSavingCurrentJd={isBusy('save-current-jd')}
          />
        ) : null}

        {activeView === 'mock' ? (
          <MockInterviewView
            jdLibrary={jdLibrary}
            mockInterviewSetup={mockInterviewSetup}
            mockInterviewSessions={mockInterviewSessions}
            selectedMockInterview={selectedMockInterview}
            currentMockQuestion={currentMockQuestion}
            pendingMockEvaluationTurn={pendingMockEvaluationTurn}
            isRecordingMockInterview={isRecordingMockInterview}
            isSubmittingMockTurn={isSubmittingMockTurn}
            onMockInterviewSetupChange={setMockInterviewSetup}
            onStartMockInterview={() => void onStartMockInterview()}
            onLoadMockInterviews={() => void onLoadMockInterviews()}
            onToggleMockInterviewRecording={() => void onToggleMockInterviewRecording()}
            onSubmitMockInterviewAnswer={(questionId, retryEvaluation) =>
              void onSubmitMockInterviewAnswer(questionId, undefined, retryEvaluation)
            }
            onSaveMockInterviewToTracker={() => void onSaveMockInterviewToTracker()}
            onOpenMockInterview={(id) => void onOpenMockInterview(id)}
            isStartingMockInterview={isBusy('start-mock-interview')}
          />
        ) : null}

        {activeView === 'applications' ? (
          <ApplicationsView
            applicationView={applicationView}
            applicationFilters={applicationFilters}
            applicationBoard={applicationBoard}
            applications={applications}
            selectedApplication={selectedApplication}
            draggingApplicationId={draggingApplicationId}
            dragTargetStatus={dragTargetStatus}
            onApplicationViewChange={(view) => {
              setApplicationView(view);
              void onLoadApplications(view);
            }}
            onApplicationFiltersChange={setApplicationFilters}
            onLoadApplications={() => void onLoadApplications()}
            onOpenApplication={(id) => void onOpenApplication(id)}
            onUpdateApplication={(id, payload) => void onUpdateApplication(id, payload)}
            onDeleteApplication={(application) => void onDeleteApplication(application)}
            onMoveApplicationByDrag={(application, status) => void onMoveApplicationByDrag(application, status)}
            onDraggingApplicationIdChange={setDraggingApplicationId}
            onDragTargetStatusChange={setDragTargetStatus}
          />
        ) : null}

        {activeView === 'interviews' ? (
          <InterviewsView
            interviewForm={interviewForm}
            interviewFilters={interviewFilters}
            interviews={interviews}
            onInterviewFormChange={setInterviewForm}
            onInterviewFiltersChange={setInterviewFilters}
            onCreateInterview={() => void onCreateInterview()}
            onLoadInterviews={() => void onLoadInterviews()}
            onUpdateInterviewStatus={(id, status) => void onUpdateInterviewStatus(id, status)}
            onGenSummary={(id) => void onGenSummary(id)}
            isCreatingInterview={isBusy('create-interview')}
          />
        ) : null}

        {activeView === 'settings' ? (
          <section className="content-stack workspace-stage">
            <PageHeader
              eyebrow="Settings"
              title="工作区设置"
              description="把模型、密钥和账户入口从业务页面里拆开，单独放到更安静的设置页。"
              accent="neutral"
              meta={<span className="timeline-tag">系统配置</span>}
              actions={
                <ActionBar
                  left={<div className="small">这里保留工作区级配置，不混入业务数据。</div>}
                  right={
                    <div className="inline compact-actions">
                      <button onClick={onRefreshModels}>刷新模型</button>
                      <button className="secondary" onClick={onLogout}>退出登录</button>
                    </div>
                  }
                />
              }
            />
            <div className="grid-2">
              <PanelShell eyebrow="Gemini" title="模型与 API Key" subtitle="管理当前工作区使用的 Gemini Key 和默认模型。">
                <label>API Key</label>
                <input value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="输入 Gemini API Key" />
                <div className="inline compact-actions">
                  <button onClick={onValidateKey} disabled={isBusy('validate-key')}>
                    {isBusy('validate-key') ? '校验中...' : '校验并保存 Key'}
                  </button>
                  <button className="warn" onClick={onSaveModel} disabled={isBusy('save-model')}>
                    {isBusy('save-model') ? '保存中...' : '保存模型'}
                  </button>
                </div>
                <label>可用模型</label>
                <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)}>
                  <option value="">请选择模型</option>
                  {models.map((m) => <option key={m.name} value={m.name}>{m.name}{m.recommended ? ' (Recommended)' : ''}</option>)}
                </select>
              </PanelShell>
              <PanelShell eyebrow="Account" title="账户信息" subtitle="保持账户信息简单清晰，不打断主工作流。">
                <div className="result-card">
                  <div className="result-card-title">{user.name}</div>
                  <div className="result-card-subtitle">{user.email}</div>
                </div>
                <button className="secondary" onClick={onLogout}>退出登录</button>
              </PanelShell>
            </div>
          </section>
        ) : null}
      </div>

      {isNotebookLayout && detailOpen ? (
        <button
          type="button"
          className="workspace-detail-backdrop"
          aria-label="关闭右侧详情"
          onClick={() => setDetailOpen(false)}
        />
      ) : null}

      {hasContext ? (
        <DetailPanel
          title={detailPanel.title}
          body={detailPanel.body}
          isOpen={detailOpen}
          onClose={() => setDetailOpen(false)}
        />
      ) : null}
      <ConfirmDialog
        open={!!confirmDialog}
        title={confirmDialog?.title ?? ''}
        description={confirmDialog?.description ?? ''}
        confirmLabel={confirmDialog?.confirmLabel}
        tone={confirmDialog?.tone}
        busy={confirmDialog?.busyKey ? isBusy(confirmDialog.busyKey) : false}
        onCancel={() => setConfirmDialog(null)}
        onConfirm={() => {
          if (!confirmDialog) return;
          void confirmDialog.onConfirm();
        }}
      />
    </main>
  );
}

'use client';

import { startTransition, useEffect, useRef, useState } from 'react';
import { signOut } from 'next-auth/react';
import { applicationStatuses } from '@/lib/applications';
import { resumeThemes } from '@/lib/resume-themes';
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
  MockInterviewSessionStatus,
  ResumeDiffResult,
  ResumeTheme
} from '@/types/domain';
import { getMockInterviewCategoryLabel, mockInterviewSessionStatuses } from '@/lib/mock-interview';

const DEFAULT_PROFILE = {
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
  const [apiKey, setApiKey] = useState('');
  const [models, setModels] = useState<Array<{ name: string; recommended: boolean }>>([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [profileText, setProfileText] = useState(JSON.stringify(DEFAULT_PROFILE, null, 2));
  const [style, setStyle] = useState('professional');
  const [resumeMarkdown, setResumeMarkdown] = useState('');
  const [resumeId, setResumeId] = useState('');
  const [resumeTitle, setResumeTitle] = useState('');
  const [activeTheme, setActiveTheme] = useState<ResumeTheme>('CLASSIC');
  const [resumeLanguage, setResumeLanguage] = useState<Language>('zh-CN');
  const [resumeGroups, setResumeGroups] = useState<ResumeHistoryGroup[]>([]);
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

  const activeThemeDefinition = resumeThemes.find((item) => item.id === activeTheme) ?? resumeThemes[0];
  const formatTime = (value: string) => new Date(value).toLocaleString();

  const appendLog = (line: string) => {
    setLogs((prev) => [`${new Date().toLocaleTimeString()} ${line}`, ...prev].slice(0, 12));
  };

  const parseJson = <T,>(value: string): T => JSON.parse(value) as T;
  const allResumeVersions = resumeGroups.flatMap((group) => group.versions);
  const currentMockQuestion =
    selectedMockInterview?.questions.find((question) => question.id === selectedMockInterview.currentQuestionId) ?? null;
  const latestMockTurn = selectedMockInterview?.turns[selectedMockInterview.turns.length - 1] ?? null;
  const pendingMockEvaluationTurn =
    selectedMockInterview?.turns.find((turn) => turn.evaluation === null && turn.transcript.trim()) ?? null;

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
      appendLog(`已载入历史版本: ${data.id}`);
    } catch (err) {
      appendLog(`载入历史版本失败: ${(err as Error).message}`);
    }
  };

  const onLoadDiff = async () => {
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

  const onValidateKey = async () => {
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
  };

  const onGenerateResume = async () => {
    try {
      const profile = parseJson<typeof DEFAULT_PROFILE>(profileText);
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
  };

  const onOptimizeResume = async () => {
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
  };

  const onPrepareInterview = async () => {
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
  };

  const onSaveCurrentJd = async () => {
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
  };

  const onCreateApplicationFromJd = async (posting: JobPostingRecord) => {
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
    const confirmed = window.confirm(
      `确认删除投递 “${application.company} · ${application.role}”吗？如已有关联面试，系统会阻止删除。`
    );
    if (!confirmed) {
      return;
    }

    try {
      await callApi<{ deleted: boolean }>(`/api/applications/${application.id}`, {
        method: 'DELETE'
      });
      if (selectedApplication?.id === application.id) {
        setSelectedApplication(null);
      }
      appendLog(`投递已删除: ${application.company} · ${application.role}`);
      await onLoadApplications();
    } catch (err) {
      appendLog(`删除投递失败: ${(err as Error).message}`);
    }
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
    const confirmed = window.confirm(
      `确认删除 JD “${posting.company} · ${posting.role}”吗？如果它已关联面试记录，系统会阻止删除。`
    );
    if (!confirmed) {
      return;
    }

    try {
      await callApi<{ deleted: boolean }>(`/api/job-postings/${posting.id}`, {
        method: 'DELETE'
      });
      if (selectedJobPosting?.id === posting.id) {
        setSelectedJobPosting(null);
      }
      appendLog(`JD 已删除: ${posting.company} · ${posting.role}`);
      await onLoadJobPostings();
    } catch (err) {
      appendLog(`删除 JD 失败: ${(err as Error).message}`);
    }
  };

  const onSaveJobPostingDetail = async () => {
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
  };

  const onRenameResume = async () => {
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
  };

  const onDeleteResume = async (id: string) => {
    const version = allResumeVersions.find((item) => item.id === id);
    const confirmed = window.confirm(
      `确认删除简历版本 ${version ? `V${version.version}` : id} 吗？如果它有子版本，系统会自动保持版本链连续。`
    );
    if (!confirmed) {
      return;
    }

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
    } catch (err) {
      appendLog(`删除简历失败: ${(err as Error).message}`);
    }
  };

  const onCreateInterview = async () => {
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
  };

  const onCreateInterviewFromApplication = async () => {
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
  };

  const onAddTimelineNote = async () => {
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

  return (
    <main>
      <section className="hero">
        <div className="hero-top">
          <div>
            <p className="eyebrow">OpsCareer AI Workspace</p>
            <h1>Gemini 智能求职助手</h1>
            <p>当前已支持多用户、简历版本链、JD 收藏库、投递看板、模拟面试、面试状态流转和中英双语生成。</p>
          </div>
          <div className="identity-card">
            <div className="identity-name">{user.name}</div>
            <div className="small">{user.email}</div>
            <button className="secondary" onClick={onLogout}>
              退出登录
            </button>
          </div>
        </div>
        <p className="small">状态: {logs[0] ?? 'Ready'}</p>
      </section>

      <section className="grid">
        <article className="panel">
          <h2>Gemini Settings</h2>
          <label>API Key</label>
          <input value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="输入 Gemini API Key" />
          <div className="inline">
            <button onClick={onValidateKey}>校验并保存 Key</button>
            <button className="secondary" onClick={onRefreshModels}>
              刷新模型
            </button>
            <button className="warn" onClick={onSaveModel}>
              保存模型
            </button>
          </div>
          <label>可用模型</label>
          <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)}>
            <option value="">请选择模型</option>
            {models.map((m) => (
              <option key={m.name} value={m.name}>
                {m.name}
                {m.recommended ? ' (Recommended)' : ''}
              </option>
            ))}
          </select>
        </article>

        <article className="panel">
          <h2>Generation Controls</h2>
          <label>输出语言</label>
          <select value={resumeLanguage} onChange={(e) => setResumeLanguage(e.target.value as Language)}>
            <option value="zh-CN">中文</option>
            <option value="en-US">English</option>
          </select>
          <label>简历风格</label>
          <input value={style} onChange={(e) => setStyle(e.target.value)} />
          <label>目标级别</label>
          <input value={targetLevel} onChange={(e) => setTargetLevel(e.target.value)} />
          <div className="resume-preview" style={{ borderColor: activeThemeDefinition.accentColor }}>
            <div
              className="resume-preview-header"
              style={{ backgroundColor: activeThemeDefinition.accentColor, fontFamily: activeThemeDefinition.fontFamily }}
            >
              {DEFAULT_PROFILE.basics.name}
            </div>
            <div className="resume-preview-body">
              <strong>{activeThemeDefinition.sectionLabel}</strong>
              <p className="small">
                当前主题 {activeThemeDefinition.name} · 输出语言 {resumeLanguage === 'zh-CN' ? '中文' : 'English'}
              </p>
            </div>
          </div>
        </article>

        <article className="panel">
          <h2>Resume Themes</h2>
          <div className="theme-grid">
            {resumeThemes.map((theme) => (
              <button
                key={theme.id}
                className={`theme-card ${activeTheme === theme.id ? 'theme-card-active' : ''}`}
                onClick={() => onApplyTheme(theme.id)}
                style={{ ['--theme-accent' as string]: theme.accentColor }}
              >
                <span>{theme.name}</span>
                <span className="small">{theme.tone}</span>
              </button>
            ))}
          </div>
        </article>

        <article className="panel">
          <h2>Profile + Resume Builder</h2>
          <label>Profile JSON</label>
          <textarea value={profileText} onChange={(e) => setProfileText(e.target.value)} />
          <label>当前简历标题</label>
          <input value={resumeTitle} onChange={(e) => setResumeTitle(e.target.value)} placeholder="给当前版本起个名字" />
          <div className="inline">
            <button onClick={onGenerateResume}>生成简历</button>
            <button className="secondary" onClick={onOptimizeResume}>
              按 JD 优化
            </button>
            <button className="ghost" onClick={onRenameResume} disabled={!resumeId}>
              重命名当前简历
            </button>
          </div>
          <label>Resume Markdown</label>
          <textarea value={resumeMarkdown} onChange={(e) => setResumeMarkdown(e.target.value)} />
          <p className="small">Resume ID: {resumeId || '暂无'}</p>
          <div className="inline">
            <a href={resumeId ? `/api/resume/${resumeId}/export?format=md` : '#'} className="anchor-wrap">
              <button className="secondary" disabled={!resumeId}>
                导出 Markdown
              </button>
            </a>
            <a href={resumeId ? `/api/resume/${resumeId}/export?format=pdf` : '#'} className="anchor-wrap">
              <button className="warn" disabled={!resumeId}>
                导出 PDF
              </button>
            </a>
          </div>
        </article>

        <article className="panel">
          <h2>My Resumes</h2>
          <div className="inline">
            <button className="secondary" onClick={onLoadResumes}>
              刷新列表
            </button>
          </div>
          <div className="list">
            {resumeGroups.length === 0 ? <div className="item">还没有简历，先生成第一版。</div> : null}
            {resumeGroups.map((group) => (
              <div className="item" key={group.rootResumeId}>
                <div className="resume-group-header">
                  <div>
                    <strong>{group.displayTitle}</strong>
                    <div className="small">
                      {group.versionCount} 个版本 · 最近更新 {formatTime(group.updatedAt)}
                    </div>
                  </div>
                </div>
                <div className="history-list">
                  {group.versions.map((version) => (
                    <div key={version.id} className={`history-item ${resumeId === version.id ? 'history-item-active' : ''}`}>
                      <button className="history-item-main" onClick={() => onSelectResumeVersion(version.id)}>
                        <span>V{version.version}</span>
                        <span className="small">{version.targetLabel ?? '基础版本'}</span>
                        <span className="small">
                          {version.theme} · {formatTime(version.updatedAt)}
                        </span>
                      </button>
                      <button className="danger" onClick={() => onDeleteResume(version.id)}>
                        删除
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="panel panel-span">
          <h2>Resume Diff</h2>
          <div className="grid-3">
            <div>
              <label>基础版本</label>
              <select
                value={diffSelection.baseId}
                onChange={(e) => setDiffSelection((prev) => ({ ...prev, baseId: e.target.value }))}
              >
                <option value="">请选择版本</option>
                {allResumeVersions.map((version) => (
                  <option key={version.id} value={version.id}>
                    V{version.version} · {version.targetLabel ?? version.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>对比版本</label>
              <select
                value={diffSelection.compareId}
                onChange={(e) => setDiffSelection((prev) => ({ ...prev, compareId: e.target.value }))}
              >
                <option value="">请选择版本</option>
                {allResumeVersions.map((version) => (
                  <option key={version.id} value={version.id}>
                    V{version.version} · {version.targetLabel ?? version.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="align-end">
              <button onClick={onLoadDiff}>生成差异</button>
            </div>
          </div>
          {diffResult ? (
            <div className="diff-grid">
              <div className="item">
                <strong>
                  V{diffResult.base.version} {'->'} V{diffResult.compare.version}
                </strong>
                <div className="small">
                  {diffResult.base.title} {'->'} {diffResult.compare.title}
                </div>
              </div>
              <div className="item">
                <strong>Summary</strong>
                <div className="small">Before: {diffResult.diff.summary.before || '空'}</div>
                <div className="small">After: {diffResult.diff.summary.after || '空'}</div>
              </div>
              <div className="item">
                <strong>Skills</strong>
                <div className="small">新增: {diffResult.diff.skills.added.join(' / ') || '无'}</div>
                <div className="small">移除: {diffResult.diff.skills.removed.join(' / ') || '无'}</div>
              </div>
              <div className="item">
                <strong>Experiences</strong>
                {diffResult.diff.experiences.map((exp) => (
                  <div key={`${exp.company}-${exp.role}`} className="small">
                    {exp.company} · {exp.role} | 新增 {exp.addedBullets.length} / 删除 {exp.removedBullets.length}
                  </div>
                ))}
              </div>
              <div className="item">
                <strong>Projects</strong>
                {diffResult.diff.projects.map((project) => (
                  <div key={project.name} className="small">
                    {project.name} | 新增 {project.addedBullets.length} / 删除 {project.removedBullets.length}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="item">选择两个版本后即可查看摘要、技能、经历和项目差异。</div>
          )}
        </article>

        <article className="panel">
          <h2>JD Optimizer + Interview Coach</h2>
          <label>JD JSON</label>
          <textarea value={jdText} onChange={(e) => setJdText(e.target.value)} />
          <div className="inline">
            <button onClick={onOptimizeResume}>简历优化 + 诊断</button>
            <button className="secondary" onClick={onPrepareInterview}>
              生成面试建议
            </button>
            <button className="warn" onClick={onSaveCurrentJd}>
              收藏当前 JD
            </button>
          </div>
          <label>诊断输出</label>
          <pre>{optResult || '暂无诊断结果'}</pre>
          <label>面试建议输出</label>
          <pre>{prepResult || '暂无面试建议'}</pre>
        </article>

        <article className="panel">
          <h2>JD Library</h2>
          <label>搜索</label>
          <input value={jdSearch} onChange={(e) => setJdSearch(e.target.value)} placeholder="公司 / 岗位 / 关键词" />
          <div className="inline">
            <button className="secondary" onClick={() => onLoadJobPostings(jdSearch, savedOnly)}>
              搜索
            </button>
            <button className="ghost" onClick={() => setSavedOnly((prev) => !prev)}>
              {savedOnly ? '只看收藏中' : '查看全部'}
            </button>
          </div>
          <div className="list">
            {jdLibrary.length === 0 ? <div className="item">暂无 JD 收藏记录</div> : null}
            {jdLibrary.map((posting) => (
              <div className="item" key={posting.id}>
                <strong>
                  {posting.company} · {posting.role}
                </strong>
                <div className="small">
                  {posting.language} · {posting.source} · {posting.saved ? '已收藏' : '未收藏'}
                </div>
                <div className="truncate">{posting.description}</div>
                <div className="inline">
                  <button onClick={() => onCreateApplicationFromJd(posting)}>创建投递</button>
                  <button className="warn" onClick={() => void onStartMockInterviewWithJobPosting(posting)}>
                    模拟面试
                  </button>
                  <button className="secondary" onClick={() => onLoadJobPostingIntoEditor(posting)}>
                    载入编辑器
                  </button>
                  <button onClick={() => onOptimizeWithJobPosting(posting)}>快捷优化</button>
                  <button className="secondary" onClick={() => onPrepareInterviewWithJobPosting(posting)}>
                    面试准备
                  </button>
                  <button className="secondary" onClick={() => onOpenJobPostingDetail(posting.id)}>
                    详情编辑
                  </button>
                  <button className="ghost" onClick={() => onToggleSavedJobPosting(posting)}>
                    {posting.saved ? '取消收藏' : '收藏'}
                  </button>
                  <button className="danger" onClick={() => onDeleteJobPosting(posting)}>
                    删除 JD
                  </button>
                </div>
              </div>
            ))}
          </div>
          {selectedJobPosting ? (
            <div className="jd-detail-card">
              <label>JD 公司</label>
              <input
                value={selectedJobPosting.company}
                onChange={(e) =>
                  setSelectedJobPosting((prev) => (prev ? { ...prev, company: e.target.value } : prev))
                }
              />
              <label>JD 岗位</label>
              <input
                value={selectedJobPosting.role}
                onChange={(e) =>
                  setSelectedJobPosting((prev) => (prev ? { ...prev, role: e.target.value } : prev))
                }
              />
              <label>JD 语言</label>
              <select
                value={selectedJobPosting.language}
                onChange={(e) =>
                  setSelectedJobPosting((prev) =>
                    prev ? { ...prev, language: e.target.value as Language } : prev
                  )
                }
              >
                <option value="zh-CN">中文</option>
                <option value="en-US">English</option>
              </select>
              <label>JD 描述</label>
              <textarea
                value={selectedJobPosting.description}
                onChange={(e) =>
                  setSelectedJobPosting((prev) => (prev ? { ...prev, description: e.target.value } : prev))
                }
              />
              <div className="inline">
                <button onClick={onSaveJobPostingDetail}>保存 JD 详情</button>
                <button className="secondary" onClick={() => onLoadJobPostingIntoEditor(selectedJobPosting)}>
                  载入编辑器
                </button>
              </div>
            </div>
          ) : null}
        </article>

        <article className="panel panel-span">
          <h2>Applications</h2>
          <div className="inline">
            <button
              className={applicationView === 'board' ? 'secondary' : 'ghost'}
              onClick={() => {
                setApplicationView('board');
                void onLoadApplications('board');
              }}
            >
              阶段看板
            </button>
            <button
              className={applicationView === 'list' ? 'secondary' : 'ghost'}
              onClick={() => {
                setApplicationView('list');
                void onLoadApplications('list');
              }}
            >
              公司/岗位视图
            </button>
          </div>
          <div className="grid-5">
            <div>
              <label>状态</label>
              <select
                value={applicationFilters.status}
                onChange={(e) => setApplicationFilters((prev) => ({ ...prev, status: e.target.value }))}
              >
                <option value="">全部</option>
                {applicationStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>公司</label>
              <input
                value={applicationFilters.company}
                onChange={(e) => setApplicationFilters((prev) => ({ ...prev, company: e.target.value }))}
              />
            </div>
            <div>
              <label>岗位</label>
              <input
                value={applicationFilters.role}
                onChange={(e) => setApplicationFilters((prev) => ({ ...prev, role: e.target.value }))}
              />
            </div>
            <div>
              <label>优先级</label>
              <select
                value={applicationFilters.priority}
                onChange={(e) => setApplicationFilters((prev) => ({ ...prev, priority: e.target.value }))}
              >
                <option value="">全部</option>
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
              </select>
            </div>
            <div>
              <label>关键词</label>
              <input
                value={applicationFilters.q}
                onChange={(e) => setApplicationFilters((prev) => ({ ...prev, q: e.target.value }))}
              />
            </div>
          </div>
          <button className="secondary" onClick={() => onLoadApplications()}>
            应用筛选
          </button>

          {applicationView === 'board' ? (
            <div className="board-grid">
              {applicationBoard.map((column) => (
                <div
                  key={column.status}
                  className={`board-column ${dragTargetStatus === column.status ? 'board-column-active' : ''}`}
                  onDragOver={(event) => {
                    event.preventDefault();
                    if (draggingApplicationId) {
                      setDragTargetStatus(column.status);
                    }
                  }}
                  onDragLeave={() => {
                    setDragTargetStatus((prev) => (prev === column.status ? '' : prev));
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    const applicationId = event.dataTransfer.getData('text/plain');
                    const application = applicationBoard.flatMap((item) => item.items).find((item) => item.id === applicationId);
                    if (application) {
                      void onMoveApplicationByDrag(application, column.status);
                    } else {
                      setDraggingApplicationId('');
                      setDragTargetStatus('');
                    }
                  }}
                >
                  <div className="board-header">
                    <strong>{column.status}</strong>
                    <span className="small">{column.items.length}</span>
                  </div>
                  <div className="list">
                    {column.items.length === 0 ? <div className="item small">暂无投递</div> : null}
                    {column.items.map((application) => (
                      <div
                        key={application.id}
                        className={`item board-card ${draggingApplicationId === application.id ? 'board-card-dragging' : ''}`}
                        draggable
                        onDragStart={(event) => {
                          event.dataTransfer.setData('text/plain', application.id);
                          event.dataTransfer.effectAllowed = 'move';
                          setDraggingApplicationId(application.id);
                        }}
                        onDragEnd={() => {
                          setDraggingApplicationId('');
                          setDragTargetStatus('');
                        }}
                      >
                        <strong>
                          {application.company} · {application.role}
                        </strong>
                        <div className="small">
                          {application.priority} · {application.resumeLabel ?? '未绑定简历'} · 面试 {application.interviewCount} 轮
                        </div>
                        <div className="small">最近更新 {formatTime(application.updatedAt)}</div>
                        <div className="small">拖到其他列可快捷推进状态</div>
                        <div className="inline">
                          <select
                            value={application.status}
                            onChange={(e) =>
                              void onUpdateApplication(application.id, {
                                status: e.target.value as ApplicationStatus,
                                appliedAt: e.target.value === 'APPLIED' ? new Date().toISOString() : undefined
                              })
                            }
                          >
                            {applicationStatuses.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                          <button className="secondary" onClick={() => onOpenApplication(application.id)}>
                            详情
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid-2 board-layout">
              <div className="list">
                {applications.length === 0 ? <div className="item">暂无投递记录</div> : null}
                {applications.map((application) => (
                  <div key={application.id} className="item">
                    <strong>
                      {application.company} · {application.role}
                    </strong>
                    <div className="small">
                      {application.status} · {application.priority} · {application.resumeLabel ?? '未绑定简历'}
                    </div>
                    <div className="small">来源: {application.source ?? '未填写'} | 最近更新 {formatTime(application.updatedAt)}</div>
                    <div className="inline">
                      <button className="secondary" onClick={() => onOpenApplication(application.id)}>
                        打开详情
                      </button>
                      <button className="danger" onClick={() => onDeleteApplication(application)}>
                        删除投递
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="application-detail-card">
                {selectedApplication ? (
                  <>
                    <h3>
                      {selectedApplication.company} · {selectedApplication.role}
                    </h3>
                    <label>投递状态</label>
                    <select
                      value={selectedApplication.status}
                      onChange={(e) =>
                        setSelectedApplication((prev) =>
                          prev ? { ...prev, status: e.target.value as ApplicationStatus } : prev
                        )
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
                        setSelectedApplication((prev) =>
                          prev ? { ...prev, resumeId: e.target.value || null } : prev
                        )
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
                        setSelectedApplication((prev) =>
                          prev ? { ...prev, source: e.target.value || null } : prev
                        )
                      }
                      placeholder="官网 / 内推 / 猎头"
                    />
                    <label>投递备注</label>
                    <textarea
                      value={selectedApplication.notes}
                      onChange={(e) =>
                        setSelectedApplication((prev) => (prev ? { ...prev, notes: e.target.value } : prev))
                      }
                    />
                    <div className="small">JD 语言: {selectedApplication.language}</div>
                    <div className="small">已绑定简历: {selectedApplication.resumeLabel ?? '未绑定'}</div>
                    <div className="small">创建时间: {formatTime(selectedApplication.createdAt)}</div>
                    <div className="small">最近变更: {formatTime(selectedApplication.updatedAt)}</div>
                    <div className="inline">
                      <button
                        onClick={() =>
                          void onUpdateApplication(selectedApplication.id, {
                            status: selectedApplication.status,
                            priority: selectedApplication.priority,
                            resumeId: selectedApplication.resumeId,
                            source: selectedApplication.source,
                            notes: selectedApplication.notes,
                            appliedAt:
                              selectedApplication.status === 'APPLIED'
                                ? selectedApplication.appliedAt ?? new Date().toISOString()
                                : selectedApplication.appliedAt
                          })
                        }
                      >
                        保存投递详情
                      </button>
                      <button className="warn" onClick={() => void onStartMockInterviewWithApplication(selectedApplication)}>
                        发起模拟面试
                      </button>
                      <button className="secondary" onClick={() => onLoadJobPostingIntoEditor({
                        id: selectedApplication.id,
                        company: selectedApplication.company,
                        role: selectedApplication.role,
                        description: selectedApplication.description,
                        language: selectedApplication.language,
                        source: 'MANUAL',
                        saved: true,
                        updatedAt: new Date().toISOString()
                      })}>
                        载入 JD 编辑器
                      </button>
                    </div>
                    <div className="list" style={{ marginTop: 12 }}>
                      <div className="item">
                        <strong>Timeline</strong>
                        {selectedApplication.timeline.length === 0 ? (
                          <div className="small">暂无时间线事件</div>
                        ) : (
                          selectedApplication.timeline.map((event) => (
                            <div key={event.id} className="timeline-event">
                              <div
                                className={`timeline-dot ${
                                  event.kind === 'manual_note' ? 'timeline-dot-note' : ''
                                }`}
                              />
                              <div>
                                <div>
                                  <strong>{event.title}</strong>
                                </div>
                                <div className="small">{event.detail}</div>
                                {event.nextStep ? <div className="timeline-tag">下一步: {event.nextStep}</div> : null}
                                {event.reminderAt ? (
                                  <div className="timeline-tag timeline-tag-warn">
                                    提醒时间: {formatTime(event.reminderAt)}
                                  </div>
                                ) : null}
                                <div className="small">{formatTime(event.at)}</div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      <div className="item">
                        <strong>添加时间线备注</strong>
                        <label>标题</label>
                        <input
                          value={applicationTimelineForm.title}
                          onChange={(e) =>
                            setApplicationTimelineForm((prev) => ({ ...prev, title: e.target.value }))
                          }
                          placeholder="例如：内推进展 / 电话跟进 / 复盘结论"
                        />
                        <label>备注内容</label>
                        <textarea
                          value={applicationTimelineForm.detail}
                          onChange={(e) =>
                            setApplicationTimelineForm((prev) => ({ ...prev, detail: e.target.value }))
                          }
                          placeholder="记录这次跟进做了什么、对方反馈了什么、下一步准备怎么推进。"
                        />
                        <label>下一步行动</label>
                        <input
                          value={applicationTimelineForm.nextStep}
                          onChange={(e) =>
                            setApplicationTimelineForm((prev) => ({ ...prev, nextStep: e.target.value }))
                          }
                          placeholder="例如：周三前补发项目材料 / 约 HR 电话沟通"
                        />
                        <label>提醒日期</label>
                        <input
                          type="datetime-local"
                          value={applicationTimelineForm.reminderAt}
                          onChange={(e) =>
                            setApplicationTimelineForm((prev) => ({ ...prev, reminderAt: e.target.value }))
                          }
                        />
                        <button onClick={onAddTimelineNote}>保存到时间线</button>
                      </div>
                      <div className="item">
                        <strong>快速创建面试</strong>
                        <label>轮次</label>
                        <input
                          value={applicationInterviewForm.roundName}
                          onChange={(e) =>
                            setApplicationInterviewForm((prev) => ({ ...prev, roundName: e.target.value }))
                          }
                        />
                        <label>面试官</label>
                        <input
                          value={applicationInterviewForm.interviewer}
                          onChange={(e) =>
                            setApplicationInterviewForm((prev) => ({ ...prev, interviewer: e.target.value }))
                          }
                          placeholder="可选"
                        />
                        <label>面试时间</label>
                        <input
                          type="datetime-local"
                          value={applicationInterviewForm.scheduledAt}
                          onChange={(e) =>
                            setApplicationInterviewForm((prev) => ({ ...prev, scheduledAt: e.target.value }))
                          }
                        />
                        <label>面试阶段状态</label>
                        <select
                          value={applicationInterviewForm.status}
                          onChange={(e) =>
                            setApplicationInterviewForm((prev) => ({
                              ...prev,
                              status: e.target.value as InterviewRecord['status']
                            }))
                          }
                        >
                          <option value="SCREENING">SCREENING</option>
                          <option value="TECHNICAL">TECHNICAL</option>
                          <option value="FINAL">FINAL</option>
                          <option value="OFFER">OFFER</option>
                          <option value="REJECTED">REJECTED</option>
                          <option value="WITHDRAWN">WITHDRAWN</option>
                        </select>
                        <label>面试备注</label>
                        <textarea
                          value={applicationInterviewForm.notes}
                          onChange={(e) =>
                            setApplicationInterviewForm((prev) => ({ ...prev, notes: e.target.value }))
                          }
                        />
                        <button onClick={onCreateInterviewFromApplication}>保存到该投递</button>
                      </div>
                      <div className="item">
                        <strong>关联面试</strong>
                        {selectedApplication.interviews.length === 0 ? (
                          <div className="small">暂无面试记录</div>
                        ) : (
                          selectedApplication.interviews.map((interview) => (
                            <div key={interview.id} className="small">
                              {interview.roundName} · {interview.status} · {interview.summary ?? '未总结'}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="item">打开一条投递后，可在这里查看详情、绑定简历和查看面试关联。</div>
                )}
              </div>
            </div>
          )}
        </article>

        <article className="panel panel-span">
          <h2>Mock Interview</h2>
          <div className="grid-2 mock-interview-layout">
            <div className="list">
              <div className="item">
                <strong>Setup</strong>
                <label>选择已有 JD</label>
                <select
                  value={mockInterviewSetup.jobPostingId}
                  onChange={(e) => setMockInterviewSetup((prev) => ({ ...prev, jobPostingId: e.target.value }))}
                >
                  <option value="">使用当前 JD 编辑区</option>
                  {jdLibrary.map((posting) => (
                    <option key={posting.id} value={posting.id}>
                      {posting.company} · {posting.role}
                    </option>
                  ))}
                </select>
                <label>语言</label>
                <select
                  value={mockInterviewSetup.language}
                  onChange={(e) =>
                    setMockInterviewSetup((prev) => ({ ...prev, language: e.target.value as Language }))
                  }
                >
                  <option value="zh-CN">中文</option>
                  <option value="en-US">English</option>
                </select>
                <label>目标级别</label>
                <input
                  value={mockInterviewSetup.targetLevel}
                  onChange={(e) => setMockInterviewSetup((prev) => ({ ...prev, targetLevel: e.target.value }))}
                />
                <label>题目数量</label>
                <select
                  value={mockInterviewSetup.questionCount}
                  onChange={(e) =>
                    setMockInterviewSetup((prev) => ({
                      ...prev,
                      questionCount: Number(e.target.value) as 3 | 5 | 8
                    }))
                  }
                >
                  <option value={3}>3 题</option>
                  <option value={5}>5 题</option>
                  <option value={8}>8 题</option>
                </select>
                <div className="inline">
                  <button onClick={() => void onStartMockInterview()}>开始模拟</button>
                  <button
                    className="secondary"
                    onClick={() => {
                      setMockInterviewSetup((prev) => ({ ...prev, jobPostingId: '' }));
                      void onStartMockInterview();
                    }}
                  >
                    使用当前 JD
                  </button>
                </div>
              </div>

              <div className="item">
                <strong>历史会话</strong>
                <div className="grid-2">
                  <div>
                    <label>状态筛选</label>
                    <select
                      value={mockInterviewFilters.status}
                      onChange={(e) => setMockInterviewFilters((prev) => ({ ...prev, status: e.target.value }))}
                    >
                      <option value="">全部</option>
                      {mockInterviewSessionStatuses.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label>关键词</label>
                    <input
                      value={mockInterviewFilters.q}
                      onChange={(e) => setMockInterviewFilters((prev) => ({ ...prev, q: e.target.value }))}
                      placeholder="公司 / 岗位"
                    />
                  </div>
                </div>
                <button className="secondary" onClick={() => void onLoadMockInterviews()}>
                  刷新会话
                </button>
                <div className="list" style={{ marginTop: 10 }}>
                  {mockInterviewSessions.length === 0 ? <div className="item">暂无模拟面试记录</div> : null}
                  {mockInterviewSessions.map((session) => (
                    <div key={session.id} className="item">
                      <div>
                        <strong>
                          {session.company} · {session.role}
                        </strong>
                      </div>
                      <div className="small">
                        {session.status} · {session.targetLevel} · {session.answeredCount}/{session.questionCount} 题
                      </div>
                      <div className="small">
                        {session.overallScore !== null ? `总分 ${session.overallScore}` : '尚未完成'} · 最近更新{' '}
                        {formatTime(session.updatedAt)}
                      </div>
                      <button className="secondary" onClick={() => void onOpenMockInterview(session.id)}>
                        打开会话
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="application-detail-card">
              {selectedMockInterview ? (
                <>
                  <h3>
                    {selectedMockInterview.company} · {selectedMockInterview.role}
                  </h3>
                  <div className="small">
                    {selectedMockInterview.status} · {selectedMockInterview.targetLevel} · 已完成{' '}
                    {selectedMockInterview.turns.length}/{selectedMockInterview.questionCount} 题
                  </div>

                  {currentMockQuestion ? (
                    <div className="item" style={{ marginTop: 12 }}>
                      <strong>Interview Runner</strong>
                      <div className="timeline-tag">{getMockInterviewCategoryLabel(currentMockQuestion.category)}</div>
                      <div className="small">
                        第 {currentMockQuestion.order} 题 · 难度 {currentMockQuestion.difficulty}
                      </div>
                      <p>{currentMockQuestion.question}</p>
                      <div className="small">考察意图: {currentMockQuestion.intent}</div>
                      <div className="inline">
                        <button
                          onClick={() => void onToggleMockInterviewRecording()}
                          disabled={isSubmittingMockTurn}
                        >
                          {isRecordingMockInterview ? '结束录音并提交' : '开始录音回答'}
                        </button>
                        {pendingMockEvaluationTurn?.questionId === currentMockQuestion.id ? (
                          <button
                            className="warn"
                            onClick={() => void onSubmitMockInterviewAnswer(currentMockQuestion.id, undefined, true)}
                            disabled={isSubmittingMockTurn}
                          >
                            重试评分
                          </button>
                        ) : null}
                      </div>
                      <div className="small">
                        {isRecordingMockInterview
                          ? '录音中，请尽量完整回答后再结束。'
                          : '每题按“录完一次 -> 上传 -> 转写 -> 评分”流程处理。'}
                      </div>
                    </div>
                  ) : (
                    <div className="item" style={{ marginTop: 12 }}>
                      <strong>Interview Runner</strong>
                      <div className="small">当前会话已没有待回答题目。</div>
                      {selectedMockInterview.status !== 'COMPLETED' ? (
                        <button onClick={() => void onFinalizeMockInterview(selectedMockInterview.id)}>生成整场总结</button>
                      ) : null}
                    </div>
                  )}

                  <div className="item" style={{ marginTop: 12 }}>
                    <strong>最近一题反馈</strong>
                    {latestMockTurn ? (
                      <>
                        <div className="small">{formatTime(latestMockTurn.answeredAt)}</div>
                        <div className="mock-answer-card">
                          <strong>转写文本</strong>
                          <div className="small">{latestMockTurn.transcript}</div>
                        </div>
                        {latestMockTurn.evaluation ? (
                          <div className="mock-score-grid">
                            <div className="item">
                              <strong>本题得分</strong>
                              <div className="mock-score">{latestMockTurn.evaluation.score}</div>
                            </div>
                            <div className="item">
                              <strong>亮点</strong>
                              <div className="small">{latestMockTurn.evaluation.strengths.join('；') || '无'}</div>
                            </div>
                            <div className="item">
                              <strong>不足</strong>
                              <div className="small">{latestMockTurn.evaluation.gaps.join('；') || '无'}</div>
                            </div>
                            <div className="item">
                              <strong>建议追问</strong>
                              <div className="small">{latestMockTurn.evaluation.followUpAdvice}</div>
                            </div>
                          </div>
                        ) : (
                          <div className="small">本题转写已保存，但评分尚未成功，可点击“重试评分”。</div>
                        )}
                      </>
                    ) : (
                      <div className="small">还没有作答记录。</div>
                    )}
                  </div>

                  <div className="item" style={{ marginTop: 12 }}>
                    <strong>Session Review</strong>
                    {selectedMockInterview.summary ? (
                      <>
                        <div className="mock-score-grid">
                          <div className="item">
                            <strong>总分</strong>
                            <div className="mock-score">{selectedMockInterview.summary.overallScore}</div>
                          </div>
                          <div className="item">
                            <strong>表现等级</strong>
                            <div className="small">{selectedMockInterview.summary.performanceLevel}</div>
                          </div>
                          <div className="item">
                            <strong>维度分</strong>
                            <div className="small">
                              相关性 {selectedMockInterview.summary.dimensionScores.relevance} / 技术深度{' '}
                              {selectedMockInterview.summary.dimensionScores.technicalDepth} / 结构表达{' '}
                              {selectedMockInterview.summary.dimensionScores.structure}
                            </div>
                            <div className="small">
                              岗位匹配 {selectedMockInterview.summary.dimensionScores.jobFit} / 证据充分度{' '}
                              {selectedMockInterview.summary.dimensionScores.evidence}
                            </div>
                          </div>
                          <div className="item">
                            <strong>优势</strong>
                            <div className="small">{selectedMockInterview.summary.topStrengths.join('；') || '无'}</div>
                          </div>
                          <div className="item">
                            <strong>风险点</strong>
                            <div className="small">{selectedMockInterview.summary.topRisks.join('；') || '无'}</div>
                          </div>
                          <div className="item">
                            <strong>建议复习</strong>
                            <div className="small">
                              {selectedMockInterview.summary.recommendedTopics.join('；') || '无'}
                            </div>
                          </div>
                        </div>
                        <button className="warn" onClick={() => void onSaveMockInterviewToTracker()}>
                          保存到 Interview Tracker
                        </button>
                      </>
                    ) : (
                      <div className="small">完成全部题目后，这里会展示整场总分、维度分和改进建议。</div>
                    )}
                    <div className="list" style={{ marginTop: 10 }}>
                      {selectedMockInterview.questions.map((question) => {
                        const turn = selectedMockInterview.turns.find((item) => item.questionId === question.id);
                        return (
                          <div key={question.id} className="item">
                            <div>
                              <strong>
                                第 {question.order} 题 · {getMockInterviewCategoryLabel(question.category)}
                              </strong>
                            </div>
                            <div className="small">{question.question}</div>
                            <div className="small">
                              {turn?.evaluation ? `得分 ${turn.evaluation.score}` : turn ? '已转写待评分' : '未作答'}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              ) : (
                <div className="item">选择一场模拟面试后，可以在这里逐题录音作答、查看评分和整场总结。</div>
              )}
            </div>
          </div>
        </article>

        <article className="panel panel-span">
          <h2>Interview Tracker</h2>
          <div className="grid-2">
            <div>
              <label>Application ID</label>
              <input
                value={interviewForm.applicationId}
                onChange={(e) => setInterviewForm((v) => ({ ...v, applicationId: e.target.value }))}
              />
              <label>Job Posting ID</label>
              <input
                value={interviewForm.jobPostingId}
                onChange={(e) => setInterviewForm((v) => ({ ...v, jobPostingId: e.target.value }))}
              />
              <label>面试轮次</label>
              <input
                value={interviewForm.roundName}
                onChange={(e) => setInterviewForm((v) => ({ ...v, roundName: e.target.value }))}
              />
              <label>面试记录</label>
              <textarea
                value={interviewForm.notes}
                onChange={(e) => setInterviewForm((v) => ({ ...v, notes: e.target.value }))}
              />
              <div className="inline">
                <button onClick={onCreateInterview}>保存记录</button>
                <button className="secondary" onClick={() => onLoadInterviews()}>
                  刷新列表
                </button>
              </div>
            </div>
            <div>
              <div className="grid-3">
                <div>
                  <label>状态筛选</label>
                  <select
                    value={interviewFilters.status}
                    onChange={(e) => setInterviewFilters((prev) => ({ ...prev, status: e.target.value }))}
                  >
                    <option value="">全部</option>
                    <option value="APPLIED">APPLIED</option>
                    <option value="SCREENING">SCREENING</option>
                    <option value="TECHNICAL">TECHNICAL</option>
                    <option value="FINAL">FINAL</option>
                    <option value="OFFER">OFFER</option>
                    <option value="REJECTED">REJECTED</option>
                    <option value="WITHDRAWN">WITHDRAWN</option>
                  </select>
                </div>
                <div>
                  <label>公司筛选</label>
                  <input
                    value={interviewFilters.company}
                    onChange={(e) => setInterviewFilters((prev) => ({ ...prev, company: e.target.value }))}
                  />
                </div>
                <div>
                  <label>岗位筛选</label>
                  <input
                    value={interviewFilters.role}
                    onChange={(e) => setInterviewFilters((prev) => ({ ...prev, role: e.target.value }))}
                  />
                </div>
              </div>
              <button className="secondary" onClick={() => onLoadInterviews()}>
                应用筛选
              </button>
              <div className="list" style={{ marginTop: 10 }}>
                {interviews.length === 0 ? <div className="item">暂无面试记录</div> : null}
                {interviews.map((item) => (
                  <div className="item" key={item.id}>
                    <div>
                      <strong>{item.jobPosting.company}</strong> · {item.jobPosting.role}
                    </div>
                    <div className="small">
                      轮次: {item.roundName} | 状态: {item.status}
                    </div>
                    <div>{item.notes}</div>
                    <div className="small">总结: {item.summary ?? '未生成'}</div>
                    <div className="inline">
                      <select value={item.status} onChange={(e) => onUpdateInterviewStatus(item.id, e.target.value as InterviewRecord['status'])}>
                        <option value="APPLIED">APPLIED</option>
                        <option value="SCREENING">SCREENING</option>
                        <option value="TECHNICAL">TECHNICAL</option>
                        <option value="FINAL">FINAL</option>
                        <option value="OFFER">OFFER</option>
                        <option value="REJECTED">REJECTED</option>
                        <option value="WITHDRAWN">WITHDRAWN</option>
                      </select>
                      <button className="warn" onClick={() => onGenSummary(item.id)}>
                        生成复盘
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </article>
      </section>

      <section className="panel" style={{ marginTop: 14 }}>
        <h2>操作日志</h2>
        <pre>{logs.join('\n') || '暂无日志'}</pre>
      </section>
    </main>
  );
}

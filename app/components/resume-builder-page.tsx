'use client';

import { useEffect, useMemo, useReducer, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCompletion } from '@ai-sdk/react';
import { signOut } from 'next-auth/react';
import { Sidebar } from '@/app/components/layout/sidebar';
import { Topbar } from '@/app/components/layout/topbar';
import { DEFAULT_PROFILE } from '@/lib/default-profile';
import {
  createBuilderProfile,
  getBuilderHeroCopy,
  getBuilderSectionStats,
  getResumePreviewTemplateMeta,
  getResumePreviewTemplateOptions,
  getResumePreviewVariant,
  type BuilderExperience,
  type BuilderIdentity,
  type BuilderProfile,
  type BuilderProject,
  type ResumePreviewTemplate,
  toProfileInput
} from '@/lib/resume-builder';
import { getWorkspaceNavigation, getWorkspaceViewMeta, type WorkspaceView } from '@/lib/workspace-ui';
import type { Language, ProfileInput, ResumeTheme } from '@/types/domain';
import { ResumeBuilderShell } from '@/app/components/resume-builder/resume-builder-shell';
import { ResumeBuilderWizard } from '@/app/components/resume-builder/resume-builder-wizard';
import { ResumeBuilderForm } from '@/app/components/resume-builder/resume-builder-form';
import { ResumePreview } from '@/app/components/resume-builder/resume-preview';

type BuilderStep = 'wizard-identity' | 'wizard-role' | 'editor';
type PolishTarget = { sectionType: 'experience' | 'project'; index: number } | null;

type BuilderState = {
  step: BuilderStep;
  identity: BuilderIdentity | null;
  targetRole: string;
  language: Language;
  profile: BuilderProfile;
};

type BuilderAction =
  | { type: 'loadProfile'; profile: ProfileInput }
  | { type: 'setIdentity'; identity: BuilderIdentity }
  | { type: 'setTargetRole'; targetRole: string }
  | { type: 'advanceWizard' }
  | { type: 'backWizard' }
  | { type: 'setLanguage'; language: Language }
  | { type: 'patchBasics'; patch: Partial<BuilderProfile['basics']> }
  | { type: 'setSkills'; skills: string[] }
  | { type: 'addEducation' }
  | { type: 'patchEducation'; index: number; patch: Partial<BuilderProfile['education'][number]> }
  | { type: 'removeEducation'; index: number }
  | { type: 'addExperience' }
  | { type: 'patchExperience'; index: number; patch: Partial<BuilderExperience> }
  | { type: 'removeExperience'; index: number }
  | { type: 'addProject' }
  | { type: 'patchProject'; index: number; patch: Partial<BuilderProject> }
  | { type: 'removeProject'; index: number };

const navigation = getWorkspaceNavigation();
const viewMeta = {
  home: getWorkspaceViewMeta('home'),
  profile: getWorkspaceViewMeta('profile'),
  resumes: getWorkspaceViewMeta('resumes'),
  jobs: getWorkspaceViewMeta('jobs'),
  mock: getWorkspaceViewMeta('mock'),
  applications: getWorkspaceViewMeta('applications'),
  interviews: getWorkspaceViewMeta('interviews'),
  settings: getWorkspaceViewMeta('settings')
} satisfies Record<WorkspaceView, ReturnType<typeof getWorkspaceViewMeta>>;

function TemplateThumbnail({ template }: { template: ResumePreviewTemplate }) {
  return (
    <div className={`builder-template-thumb builder-template-thumb-${template}`} aria-hidden="true">
      <div className="builder-template-thumb-header">
        <span className="builder-template-thumb-title" />
        <span className="builder-template-thumb-meta" />
      </div>
      <div className="builder-template-thumb-body">
        <span className="builder-template-thumb-line builder-template-thumb-line-lg" />
        <span className="builder-template-thumb-line" />
        <span className="builder-template-thumb-line builder-template-thumb-line-short" />
      </div>
      <div className="builder-template-thumb-sections">
        <span className="builder-template-thumb-chip" />
        <span className="builder-template-thumb-chip" />
        <span className="builder-template-thumb-chip" />
      </div>
    </div>
  );
}

function builderReducer(state: BuilderState, action: BuilderAction): BuilderState {
  switch (action.type) {
    case 'loadProfile':
      return {
        ...state,
        language: action.profile.language ?? state.language,
        profile: createBuilderProfile(action.profile)
      };
    case 'setIdentity':
      return { ...state, identity: action.identity };
    case 'setTargetRole':
      return { ...state, targetRole: action.targetRole };
    case 'advanceWizard':
      return {
        ...state,
        step:
          state.step === 'wizard-identity'
            ? 'wizard-role'
            : state.step === 'wizard-role'
              ? 'editor'
              : 'editor'
      };
    case 'backWizard':
      return {
        ...state,
        step: state.step === 'wizard-role' ? 'wizard-identity' : state.step
      };
    case 'setLanguage':
      return { ...state, language: action.language };
    case 'patchBasics':
      return { ...state, profile: { ...state.profile, basics: { ...state.profile.basics, ...action.patch } } };
    case 'setSkills':
      return { ...state, profile: { ...state.profile, skills: action.skills } };
    case 'addEducation':
      return {
        ...state,
        profile: {
          ...state.profile,
          education: [...state.profile.education, { school: '', degree: '', major: '', start: '', end: '' }]
        }
      };
    case 'patchEducation':
      return {
        ...state,
        profile: {
          ...state.profile,
          education: state.profile.education.map((item, index) =>
            index === action.index ? { ...item, ...action.patch } : item
          )
        }
      };
    case 'removeEducation':
      return {
        ...state,
        profile: { ...state.profile, education: state.profile.education.filter((_, index) => index !== action.index) }
      };
    case 'addExperience':
      return {
        ...state,
        profile: {
          ...state.profile,
          experiences: [
            ...state.profile.experiences,
            { company: '', role: '', start: '', end: '', techStack: [], draft: '', polishedDraft: '' }
          ]
        }
      };
    case 'patchExperience':
      return {
        ...state,
        profile: {
          ...state.profile,
          experiences: state.profile.experiences.map((item, index) =>
            index === action.index ? { ...item, ...action.patch } : item
          )
        }
      };
    case 'removeExperience':
      return {
        ...state,
        profile: {
          ...state.profile,
          experiences: state.profile.experiences.filter((_, index) => index !== action.index)
        }
      };
    case 'addProject':
      return {
        ...state,
        profile: {
          ...state.profile,
          projects: [...state.profile.projects, { name: '', role: '', summary: '', draft: '', polishedDraft: '' }]
        }
      };
    case 'patchProject':
      return {
        ...state,
        profile: {
          ...state.profile,
          projects: state.profile.projects.map((item, index) =>
            index === action.index ? { ...item, ...action.patch } : item
          )
        }
      };
    case 'removeProject':
      return {
        ...state,
        profile: { ...state.profile, projects: state.profile.projects.filter((_, index) => index !== action.index) }
      };
    default:
      return state;
  }
}

async function callJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers ?? {})
    }
  });

  const json = (await res.json()) as { success: boolean; data?: T; error?: string };
  if (!json.success) throw new Error(json.error ?? 'Request failed');
  return json.data as T;
}

export function ResumeBuilderPage({
  user
}: {
  user: { id: string; name: string; email: string };
}) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const [flash, setFlash] = useState<{ tone: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [polishingTarget, setPolishingTarget] = useState<PolishTarget>(null);
  const [debouncedProfile, setDebouncedProfile] = useState(createBuilderProfile(DEFAULT_PROFILE));
  const [previewTemplate, setPreviewTemplate] = useState<ResumePreviewTemplate>('notion-clean');

  const [state, dispatch] = useReducer(builderReducer, {
    step: 'wizard-identity',
    identity: null,
    targetRole: '',
    language: DEFAULT_PROFILE.language ?? 'zh-CN',
    profile: createBuilderProfile(DEFAULT_PROFILE)
  });

  const {
    completion,
    complete,
    error,
    isLoading: isPolishing,
    setCompletion
  } = useCompletion({
    api: '/api/resume/polish',
    streamProtocol: 'text'
  });

  const setBusyState = (key: string, value: boolean) => setBusy((prev) => ({ ...prev, [key]: value }));
  const isBusy = (key: string) => !!busy[key];

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedProfile(state.profile), 140);
    return () => window.clearTimeout(timer);
  }, [state.profile]);

  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        const data = await callJson<{ id: string; title: string; profile: ProfileInput } | null>('/api/profile');
        if (!active || !data) return;
        dispatch({ type: 'loadProfile', profile: data.profile });
      } catch (loadError) {
        if (!active) return;
        setFlash({ tone: 'info', text: `未读取到已有主档，将使用当前示例继续编辑：${(loadError as Error).message}` });
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const persistProfileInput = useMemo(() => toProfileInput(state.profile, state.language), [state.profile, state.language]);
  const heroCopy = useMemo(
    () => getBuilderHeroCopy(state.step, state.identity, state.targetRole),
    [state.identity, state.step, state.targetRole]
  );
  const sectionStats = useMemo(() => getBuilderSectionStats(state.profile), [state.profile]);
  const previewVariant = useMemo(() => getResumePreviewVariant(state.targetRole), [state.targetRole]);
  const previewTemplateMeta = useMemo(() => getResumePreviewTemplateMeta(previewTemplate), [previewTemplate]);

  const saveProfile = async () => {
    setBusyState('save-profile', true);
    try {
      await callJson('/api/profile', {
        method: 'PUT',
        body: JSON.stringify({ profile: persistProfileInput })
      });
      setFlash({ tone: 'success', text: '主档已保存。' });
    } catch (saveError) {
      setFlash({ tone: 'error', text: `保存主档失败：${(saveError as Error).message}` });
      throw saveError;
    } finally {
      setBusyState('save-profile', false);
    }
  };

  const generateResume = async () => {
    setBusyState('generate-resume', true);
    try {
      await saveProfile();
      const data = await callJson<{ resumeId: string }>('/api/resume/generate', {
        method: 'POST',
        body: JSON.stringify({
          profile: persistProfileInput,
          style: state.identity === '学生' ? 'entry-level' : state.identity === '职场新人' ? 'growth' : 'professional',
          title: `${state.profile.basics.name || '候选人'}-${state.targetRole || 'Resume'}`,
          theme: 'CLASSIC' as ResumeTheme,
          context: {
            identity: state.identity,
            targetRole: state.targetRole
          }
        })
      });
      setFlash({ tone: 'success', text: '简历已生成，正在打开新版本。' });
      router.push(`/?view=resumes&resumeId=${data.resumeId}&generated=1`);
    } catch (generateError) {
      setFlash({ tone: 'error', text: `生成简历失败：${(generateError as Error).message}` });
    } finally {
      setBusyState('generate-resume', false);
    }
  };

  const startPolish = async (sectionType: 'experience' | 'project', index: number) => {
    if (!state.identity || !state.targetRole.trim()) {
      setFlash({ tone: 'info', text: '请先完成身份和目标岗位设置，再使用 AI 润色。' });
      return;
    }

    const text =
      sectionType === 'experience'
        ? state.profile.experiences[index].polishedDraft || state.profile.experiences[index].draft
        : state.profile.projects[index].polishedDraft || state.profile.projects[index].draft;

    setPolishingTarget({ sectionType, index });
    setCompletion('');

    try {
      await complete(text, {
        body: {
          sectionType,
          identity: state.identity,
          targetRole: state.targetRole,
          language: state.language
        }
      });
    } catch (polishError) {
      setFlash({ tone: 'error', text: `AI 润色失败：${(polishError as Error).message}` });
    }
  };

  const goToView = (view: WorkspaceView) => {
    if (view === 'profile') return;
    router.push(view === 'home' ? '/' : `/?view=${view}`);
  };

  return (
    <div className="workspace-shell workspace-shell-builder">
      <Sidebar
        activeView="profile"
        sidebarOpen={sidebarOpen}
        navigation={navigation}
        user={user}
        onSelect={(view) => {
          setSidebarOpen(false);
          goToView(view);
        }}
      />

      <div className="workspace-main">
        <Topbar
          activeView="profile"
          viewMeta={viewMeta}
          user={user}
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
          contextOpen={false}
          contextAvailable={false}
          onToggleContext={() => {}}
          onLogout={() => void signOut({ callbackUrl: '/auth' })}
        />

        {flash ? (
          <div className={`workspace-feedback workspace-feedback-${flash.tone}`}>
            <strong>{flash.tone === 'error' ? '操作提示' : flash.tone === 'success' ? '已完成' : '状态更新'}</strong>
            <span>{flash.text}</span>
          </div>
        ) : null}

        <ResumeBuilderShell
          left={
            <div className="builder-column">
              <section className="builder-panel builder-panel-emphasis builder-stage-card">
                <div className="builder-eyebrow">{heroCopy.eyebrow}</div>
                <h2>{heroCopy.title}</h2>
                <p className="small">{heroCopy.description}</p>
                <div className="builder-metric-strip">
                  <span className="builder-metric-chip">工作 {sectionStats.experiences}</span>
                  <span className="builder-metric-chip">项目 {sectionStats.projects}</span>
                  <span className="builder-metric-chip">技能 {sectionStats.skills}</span>
                  <span className="builder-metric-chip">完成 {sectionStats.completedSections}/5</span>
                </div>
              </section>

              {state.step !== 'editor' ? (
                <ResumeBuilderWizard
                  identity={state.identity}
                  targetRole={state.targetRole}
                  step={state.step === 'wizard-identity' ? 1 : 2}
                  onIdentityChange={(value) => dispatch({ type: 'setIdentity', identity: value })}
                  onTargetRoleChange={(value) => dispatch({ type: 'setTargetRole', targetRole: value })}
                  onBack={() => dispatch({ type: 'backWizard' })}
                  onNext={() => dispatch({ type: 'advanceWizard' })}
                />
              ) : (
                <ResumeBuilderForm
                  identity={state.identity ?? '资深职场人'}
                  targetRole={state.targetRole}
                  language={state.language}
                  profile={state.profile}
                  sectionStats={sectionStats}
                  isSaving={isBusy('save-profile')}
                  isGenerating={isBusy('generate-resume')}
                  polishingTarget={polishingTarget}
                  completion={completion}
                  completionError={error?.message ?? ''}
                  isPolishing={isPolishing}
                  onLanguageChange={(value) => dispatch({ type: 'setLanguage', language: value })}
                  onBasicsChange={(patch) => dispatch({ type: 'patchBasics', patch })}
                  onSkillsChange={(value) =>
                    dispatch({
                      type: 'setSkills',
                      skills: value
                        .split(',')
                        .map((item) => item.trim())
                        .filter(Boolean)
                    })
                  }
                  onEducationChange={(index, patch) => dispatch({ type: 'patchEducation', index, patch })}
                  onAddEducation={() => dispatch({ type: 'addEducation' })}
                  onRemoveEducation={(index) => dispatch({ type: 'removeEducation', index })}
                  onExperienceChange={(index, patch) => dispatch({ type: 'patchExperience', index, patch })}
                  onAddExperience={() => dispatch({ type: 'addExperience' })}
                  onRemoveExperience={(index) => dispatch({ type: 'removeExperience', index })}
                  onProjectChange={(index, patch) => dispatch({ type: 'patchProject', index, patch })}
                  onAddProject={() => dispatch({ type: 'addProject' })}
                  onRemoveProject={(index) => dispatch({ type: 'removeProject', index })}
                  onPolishExperience={(index) => void startPolish('experience', index)}
                  onPolishProject={(index) => void startPolish('project', index)}
                  onAcceptExperiencePolish={(index) => {
                    dispatch({ type: 'patchExperience', index, patch: { polishedDraft: completion.trim() } });
                    setPolishingTarget(null);
                    setCompletion('');
                  }}
                  onAcceptProjectPolish={(index) => {
                    dispatch({ type: 'patchProject', index, patch: { polishedDraft: completion.trim() } });
                    setPolishingTarget(null);
                    setCompletion('');
                  }}
                  onCancelPolish={() => {
                    setPolishingTarget(null);
                    setCompletion('');
                  }}
                  onSave={() => void saveProfile()}
                  onGenerate={() => void generateResume()}
                />
              )}
            </div>
          }
          right={
            <div className="builder-preview-column">
              <section className="builder-panel builder-preview-toolbar">
                <div>
                  <div className="builder-eyebrow">A4 Preview</div>
                  <h3>实时纸面预览</h3>
                  <p className="small">随左侧输入实时更新，帮助我们更早发现信息密度和表达问题。</p>
                </div>
                <div className="builder-preview-tags">
                  <span className="builder-metric-chip">{state.targetRole || '待定岗位'}</span>
                  <span className="builder-metric-chip">
                    {previewVariant === 'technical' ? '技术向' : previewVariant === 'business' ? '业务向' : '通用'}
                  </span>
                  <span className="builder-metric-chip">{previewTemplateMeta.label}</span>
                </div>
              </section>
              <section className="builder-panel builder-preview-template-strip">
                <div className="builder-preview-template-copy">
                  <div className="builder-eyebrow">Template</div>
                  <p className="small">选择一种更适合当前岗位的简洁简历版式，实时对比纸面观感。</p>
                </div>
                <div className="builder-template-tabs" role="tablist" aria-label="选择简历预览模板">
                  {getResumePreviewTemplateOptions().map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      role="tab"
                      aria-selected={previewTemplate === option.value}
                      className={previewTemplate === option.value ? 'builder-template-tab is-active' : 'builder-template-tab'}
                      onClick={() => setPreviewTemplate(option.value)}
                    >
                      {previewTemplate === option.value ? <span className="builder-template-current-badge">当前</span> : null}
                      <TemplateThumbnail template={option.value} />
                      <div className="builder-template-tab-copy">
                        <strong>{option.label}</strong>
                        <span>{option.description}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
              <ResumePreview
                identity={state.identity}
                targetRole={state.targetRole}
                profile={debouncedProfile}
                template={previewTemplate}
              />
            </div>
          }
        />
      </div>
    </div>
  );
}

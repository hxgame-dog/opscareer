'use client';

import type { BuilderExperience, BuilderIdentity, BuilderProject, BuilderProfile } from '@/lib/resume-builder';
import type { BuilderSectionStats } from '@/lib/resume-builder';
import type { Language } from '@/types/domain';
import { ExperienceEditor } from '@/app/components/resume-builder/experience-editor';
import { ProjectEditor } from '@/app/components/resume-builder/project-editor';

type PolishTarget = { sectionType: 'experience' | 'project'; index: number } | null;

type ResumeBuilderFormProps = {
  identity: BuilderIdentity;
  targetRole: string;
  language: Language;
  profile: BuilderProfile;
  sectionStats: BuilderSectionStats;
  isSaving: boolean;
  isGenerating: boolean;
  polishingTarget: PolishTarget;
  completion: string;
  completionError: string;
  isPolishing: boolean;
  onLanguageChange: (value: Language) => void;
  onBasicsChange: (patch: Partial<BuilderProfile['basics']>) => void;
  onSkillsChange: (value: string) => void;
  onEducationChange: (index: number, patch: Partial<BuilderProfile['education'][number]>) => void;
  onAddEducation: () => void;
  onRemoveEducation: (index: number) => void;
  onExperienceChange: (index: number, patch: Partial<BuilderExperience>) => void;
  onAddExperience: () => void;
  onRemoveExperience: (index: number) => void;
  onProjectChange: (index: number, patch: Partial<BuilderProject>) => void;
  onAddProject: () => void;
  onRemoveProject: (index: number) => void;
  onPolishExperience: (index: number) => void;
  onPolishProject: (index: number) => void;
  onAcceptExperiencePolish: (index: number) => void;
  onAcceptProjectPolish: (index: number) => void;
  onCancelPolish: () => void;
  onSave: () => void;
  onGenerate: () => void;
};

export function ResumeBuilderForm({
  identity,
  targetRole,
  language,
  profile,
  sectionStats,
  isSaving,
  isGenerating,
  polishingTarget,
  completion,
  completionError,
  isPolishing,
  onLanguageChange,
  onBasicsChange,
  onSkillsChange,
  onEducationChange,
  onAddEducation,
  onRemoveEducation,
  onExperienceChange,
  onAddExperience,
  onRemoveExperience,
  onProjectChange,
  onAddProject,
  onRemoveProject,
  onPolishExperience,
  onPolishProject,
  onAcceptExperiencePolish,
  onAcceptProjectPolish,
  onCancelPolish,
  onSave,
  onGenerate
}: ResumeBuilderFormProps) {
  return (
    <div className="builder-form">
      <section className="builder-panel builder-panel-emphasis">
        <div className="builder-form-topline">
          <div>
            <div className="builder-eyebrow">Writing workspace</div>
            <h2>把主档打磨成真正可投递的简历</h2>
            <p className="small">当前身份：{identity} · 目标岗位：{targetRole}。先写草稿，再对关键段落做 AI 深度润色。</p>
          </div>
          <div className="builder-inline-actions">
            <button className="secondary" type="button" onClick={onSave} disabled={isSaving}>
              {isSaving ? '保存中...' : '保存主档'}
            </button>
            <button type="button" onClick={onGenerate} disabled={isGenerating}>
              {isGenerating ? '生成中...' : '生成简历'}
            </button>
          </div>
        </div>
        <div className="builder-metric-strip">
          <span className="builder-metric-chip">工作 {sectionStats.experiences} 段</span>
          <span className="builder-metric-chip">项目 {sectionStats.projects} 个</span>
          <span className="builder-metric-chip">技能 {sectionStats.skills} 项</span>
          <span className="builder-metric-chip">完成 {sectionStats.completedSections}/5 区块</span>
        </div>
      </section>

      <details className="builder-accordion" open>
        <summary>基本信息</summary>
        <div className="builder-panel">
          <div className="builder-grid-2">
            <div>
              <label>姓名</label>
              <input value={profile.basics.name} onChange={(event) => onBasicsChange({ name: event.target.value })} />
            </div>
            <div>
              <label>邮箱</label>
              <input value={profile.basics.email} onChange={(event) => onBasicsChange({ email: event.target.value })} />
            </div>
            <div>
              <label>电话</label>
              <input value={profile.basics.phone ?? ''} onChange={(event) => onBasicsChange({ phone: event.target.value })} />
            </div>
            <div>
              <label>地点</label>
              <input value={profile.basics.location ?? ''} onChange={(event) => onBasicsChange({ location: event.target.value })} />
            </div>
            <div>
              <label>输出语言</label>
              <select value={language} onChange={(event) => onLanguageChange(event.target.value as Language)}>
                <option value="zh-CN">中文</option>
                <option value="en-US">English</option>
              </select>
            </div>
            <div>
              <label>工作年限</label>
              <input
                type="number"
                value={profile.basics.yearsOfExperience ?? 0}
                onChange={(event) => onBasicsChange({ yearsOfExperience: Number(event.target.value) || 0 })}
              />
            </div>
          </div>
          <label>个人摘要</label>
          <textarea
            className="builder-large-textarea"
            value={profile.basics.summary}
            onChange={(event) => onBasicsChange({ summary: event.target.value })}
            placeholder="用 2-3 句话说明你最核心的经历和优势。"
          />
        </div>
      </details>

      <details className="builder-accordion" open>
        <summary>教育经历</summary>
        <div className="builder-panel">
          <div className="builder-section-head">
            <div className="small">这里保持结构化填写，方便预览和后续生成稳定输出。</div>
            <button className="secondary button-compact" type="button" onClick={onAddEducation}>
              新增教育
            </button>
          </div>
          <div className="builder-stack">
            {profile.education.map((item, index) => (
              <div key={`${item.school}-${index}`} className="builder-entry-card">
                <div className="builder-grid-2">
                  <div>
                    <label>学校</label>
                    <input value={item.school} onChange={(event) => onEducationChange(index, { school: event.target.value })} />
                  </div>
                  <div>
                    <label>学历</label>
                    <input value={item.degree} onChange={(event) => onEducationChange(index, { degree: event.target.value })} />
                  </div>
                  <div>
                    <label>专业</label>
                    <input value={item.major ?? ''} onChange={(event) => onEducationChange(index, { major: event.target.value })} />
                  </div>
                  <div>
                    <label>时间</label>
                    <input
                      value={[item.start, item.end].filter(Boolean).join(' - ')}
                      onChange={(event) => {
                        const [start, end] = event.target.value.split('-').map((value) => value.trim());
                        onEducationChange(index, { start, end });
                      }}
                      placeholder="2020 - 2024"
                    />
                  </div>
                </div>
                <div className="builder-inline-actions">
                  <button className="ghost button-compact" type="button" onClick={() => onRemoveEducation(index)}>
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </details>

      <details className="builder-accordion" open>
        <summary>工作经历</summary>
        <div className="builder-panel">
          <ExperienceEditor
            items={profile.experiences}
            polishingTarget={polishingTarget}
            completion={completion}
            completionError={completionError}
            isPolishing={isPolishing}
            onChange={onExperienceChange}
            onAdd={onAddExperience}
            onRemove={onRemoveExperience}
            onPolish={onPolishExperience}
            onAcceptPolish={onAcceptExperiencePolish}
            onCancelPolish={onCancelPolish}
          />
        </div>
      </details>

      <details className="builder-accordion" open>
        <summary>项目经历</summary>
        <div className="builder-panel">
          <ProjectEditor
            items={profile.projects}
            polishingTarget={polishingTarget}
            completion={completion}
            completionError={completionError}
            isPolishing={isPolishing}
            onChange={onProjectChange}
            onAdd={onAddProject}
            onRemove={onRemoveProject}
            onPolish={onPolishProject}
            onAcceptPolish={onAcceptProjectPolish}
            onCancelPolish={onCancelPolish}
          />
        </div>
      </details>

      <details className="builder-accordion" open>
        <summary>技能</summary>
        <div className="builder-panel">
          <label>技能列表</label>
          <textarea
            value={profile.skills.join(', ')}
            onChange={(event) => onSkillsChange(event.target.value)}
            placeholder="例如：Kubernetes, Terraform, Go, AWS"
          />
        </div>
      </details>
    </div>
  );
}

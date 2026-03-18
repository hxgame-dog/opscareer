import { ActionBar } from '@/app/components/ui/action-bar';
import { PageHeader } from '@/app/components/ui/page-header';
import { PanelShell } from '@/app/components/ui/panel-shell';
import { ResultCard } from '@/app/components/ui/result-card';
import type { Language, ProfileInput } from '@/types/domain';

type ProfileViewProps = {
  profile: ProfileInput;
  profileText: string;
  showProfileJson: boolean;
  profileJsonError: string;
  resumeLanguage: Language;
  style: string;
  targetLevel: string;
  onResumeLanguageChange: (value: Language) => void;
  onStyleChange: (value: string) => void;
  onTargetLevelChange: (value: string) => void;
  onProfileChange: (profile: ProfileInput) => void;
  onProfileTextChange: (value: string) => void;
  onToggleProfileJson: () => void;
  onApplyProfileJson: () => void;
  onResetProfile: () => void;
  onGenerateResume: () => void;
  onGoResumes: () => void;
  isGeneratingResume: boolean;
};

function updateArrayItem<T>(items: T[], index: number, nextItem: T) {
  return items.map((item, itemIndex) => (itemIndex === index ? nextItem : item));
}

export function ProfileView({
  profile,
  profileText,
  showProfileJson,
  profileJsonError,
  resumeLanguage,
  style,
  targetLevel,
  onResumeLanguageChange,
  onStyleChange,
  onTargetLevelChange,
  onProfileChange,
  onProfileTextChange,
  onToggleProfileJson,
  onApplyProfileJson,
  onResetProfile,
  onGenerateResume,
  onGoResumes,
  isGeneratingResume
}: ProfileViewProps) {
  return (
    <section className="content-stack workspace-stage">
      <PageHeader
        eyebrow="Profile Base"
        title="维护你的主档信息"
        description="把基础资料、工作经历、项目和教育沉淀成一份可靠主档，后续所有简历生成和优化都从这里出发。"
        accent="slate"
        meta={
          <>
            <span className="timeline-tag">结构化建档</span>
            <span className="timeline-tag">JSON 高级模式</span>
            <span className="timeline-tag">生成联动</span>
          </>
        }
        actions={
          <ActionBar
            left={
              <div className="inline compact-actions">
                <button onClick={onGenerateResume} disabled={isGeneratingResume}>
                  {isGeneratingResume ? '生成中...' : '用主档生成简历'}
                </button>
                <button className="secondary" onClick={onGoResumes}>
                  去简历中心
                </button>
              </div>
            }
            right={
              <div className="inline compact-actions">
                <button className="ghost" onClick={onToggleProfileJson}>
                  {showProfileJson ? '收起 JSON' : '高级 JSON'}
                </button>
                <button className="secondary" onClick={onResetProfile}>
                  重置示例
                </button>
              </div>
            }
          />
        }
      />

      <div className="dashboard-hero-grid">
        <PanelShell eyebrow="Defaults" title="默认生成策略" subtitle="这些设置会直接影响后续简历生成、优化和模拟面试语言。">
          <div className="grid-3">
            <div>
              <label>输出语言</label>
              <select value={resumeLanguage} onChange={(event) => onResumeLanguageChange(event.target.value as Language)}>
                <option value="zh-CN">中文</option>
                <option value="en-US">English</option>
              </select>
            </div>
            <div>
              <label>简历风格</label>
              <input value={style} onChange={(event) => onStyleChange(event.target.value)} />
            </div>
            <div>
              <label>目标级别</label>
              <input value={targetLevel} onChange={(event) => onTargetLevelChange(event.target.value)} />
            </div>
          </div>
        </PanelShell>

        <PanelShell eyebrow="Snapshot" title="主档概览" subtitle="快速确认这份主档目前包含的核心材料。">
          <div className="metrics-strip">
            <ResultCard title="工作经历" subtitle={`${profile.experiences.length} 段`} />
            <ResultCard title="项目经历" subtitle={`${profile.projects.length} 个`} />
            <ResultCard title="技能" subtitle={`${profile.skills.length} 项`} />
            <ResultCard title="教育" subtitle={`${profile.education.length} 段`} />
          </div>
        </PanelShell>
      </div>

      <PanelShell eyebrow="Profile Form" title="个人档案分段编辑" subtitle="用更高级的分段编辑方式维护主档，而不是直接面对一整个 JSON。">
        <div className="profile-sections">
          <section className="profile-section-card">
            <h3>基本信息</h3>
            <div className="grid-2">
              <div>
                <label>姓名</label>
                <input
                  value={profile.basics.name}
                  onChange={(event) =>
                    onProfileChange({ ...profile, basics: { ...profile.basics, name: event.target.value } })
                  }
                />
              </div>
              <div>
                <label>邮箱</label>
                <input
                  value={profile.basics.email}
                  onChange={(event) =>
                    onProfileChange({ ...profile, basics: { ...profile.basics, email: event.target.value } })
                  }
                />
              </div>
              <div>
                <label>电话</label>
                <input
                  value={profile.basics.phone ?? ''}
                  onChange={(event) =>
                    onProfileChange({ ...profile, basics: { ...profile.basics, phone: event.target.value } })
                  }
                />
              </div>
              <div>
                <label>地点</label>
                <input
                  value={profile.basics.location ?? ''}
                  onChange={(event) =>
                    onProfileChange({ ...profile, basics: { ...profile.basics, location: event.target.value } })
                  }
                />
              </div>
              <div>
                <label>工作年限</label>
                <input
                  type="number"
                  min="0"
                  value={profile.basics.yearsOfExperience ?? 0}
                  onChange={(event) =>
                    onProfileChange({
                      ...profile,
                      basics: { ...profile.basics, yearsOfExperience: Number(event.target.value) || 0 }
                    })
                  }
                />
              </div>
              <div className="profile-full-span">
                <label>个人摘要</label>
                <textarea
                  value={profile.basics.summary}
                  onChange={(event) =>
                    onProfileChange({ ...profile, basics: { ...profile.basics, summary: event.target.value } })
                  }
                />
              </div>
            </div>
          </section>

          <section className="profile-section-card">
            <div className="database-header database-header-compact">
              <h3>工作经历</h3>
              <button
                className="secondary button-compact"
                onClick={() =>
                  onProfileChange({
                    ...profile,
                    experiences: [
                      ...profile.experiences,
                      { company: '', role: '', start: '', end: '', achievements: [''], techStack: [] }
                    ]
                  })
                }
              >
                新增经历
              </button>
            </div>
            <div className="profile-stack-list">
              {profile.experiences.map((experience, index) => (
                <div key={`${experience.company}-${index}`} className="profile-nested-card">
                  <div className="grid-2">
                    <div>
                      <label>公司</label>
                      <input
                        value={experience.company}
                        onChange={(event) =>
                          onProfileChange({
                            ...profile,
                            experiences: updateArrayItem(profile.experiences, index, {
                              ...experience,
                              company: event.target.value
                            })
                          })
                        }
                      />
                    </div>
                    <div>
                      <label>岗位</label>
                      <input
                        value={experience.role}
                        onChange={(event) =>
                          onProfileChange({
                            ...profile,
                            experiences: updateArrayItem(profile.experiences, index, {
                              ...experience,
                              role: event.target.value
                            })
                          })
                        }
                      />
                    </div>
                    <div>
                      <label>开始时间</label>
                      <input
                        value={experience.start}
                        onChange={(event) =>
                          onProfileChange({
                            ...profile,
                            experiences: updateArrayItem(profile.experiences, index, {
                              ...experience,
                              start: event.target.value
                            })
                          })
                        }
                      />
                    </div>
                    <div>
                      <label>结束时间</label>
                      <input
                        value={experience.end ?? ''}
                        onChange={(event) =>
                          onProfileChange({
                            ...profile,
                            experiences: updateArrayItem(profile.experiences, index, {
                              ...experience,
                              end: event.target.value
                            })
                          })
                        }
                      />
                    </div>
                    <div className="profile-full-span">
                      <label>成就亮点（每行一条）</label>
                      <textarea
                        value={experience.achievements.join('\n')}
                        onChange={(event) =>
                          onProfileChange({
                            ...profile,
                            experiences: updateArrayItem(profile.experiences, index, {
                              ...experience,
                              achievements: event.target.value
                                .split('\n')
                                .map((item) => item.trim())
                                .filter(Boolean)
                            })
                          })
                        }
                      />
                    </div>
                    <div className="profile-full-span">
                      <label>技术栈（逗号分隔）</label>
                      <input
                        value={(experience.techStack ?? []).join(', ')}
                        onChange={(event) =>
                          onProfileChange({
                            ...profile,
                            experiences: updateArrayItem(profile.experiences, index, {
                              ...experience,
                              techStack: event.target.value
                                .split(',')
                                .map((item) => item.trim())
                                .filter(Boolean)
                            })
                          })
                        }
                      />
                    </div>
                  </div>
                  <button
                    className="danger button-compact"
                    onClick={() =>
                      onProfileChange({
                        ...profile,
                        experiences: profile.experiences.filter((_, itemIndex) => itemIndex !== index)
                      })
                    }
                    disabled={profile.experiences.length === 1}
                  >
                    删除这段经历
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="profile-section-card">
            <div className="database-header database-header-compact">
              <h3>项目经历</h3>
              <button
                className="secondary button-compact"
                onClick={() =>
                  onProfileChange({
                    ...profile,
                    projects: [...profile.projects, { name: '', role: '', summary: '', highlights: [''] }]
                  })
                }
              >
                新增项目
              </button>
            </div>
            <div className="profile-stack-list">
              {profile.projects.map((project, index) => (
                <div key={`${project.name}-${index}`} className="profile-nested-card">
                  <div className="grid-2">
                    <div>
                      <label>项目名</label>
                      <input
                        value={project.name}
                        onChange={(event) =>
                          onProfileChange({
                            ...profile,
                            projects: updateArrayItem(profile.projects, index, { ...project, name: event.target.value })
                          })
                        }
                      />
                    </div>
                    <div>
                      <label>角色</label>
                      <input
                        value={project.role ?? ''}
                        onChange={(event) =>
                          onProfileChange({
                            ...profile,
                            projects: updateArrayItem(profile.projects, index, { ...project, role: event.target.value })
                          })
                        }
                      />
                    </div>
                    <div className="profile-full-span">
                      <label>项目概述</label>
                      <textarea
                        value={project.summary}
                        onChange={(event) =>
                          onProfileChange({
                            ...profile,
                            projects: updateArrayItem(profile.projects, index, { ...project, summary: event.target.value })
                          })
                        }
                      />
                    </div>
                    <div className="profile-full-span">
                      <label>项目亮点（每行一条）</label>
                      <textarea
                        value={project.highlights.join('\n')}
                        onChange={(event) =>
                          onProfileChange({
                            ...profile,
                            projects: updateArrayItem(profile.projects, index, {
                              ...project,
                              highlights: event.target.value
                                .split('\n')
                                .map((item) => item.trim())
                                .filter(Boolean)
                            })
                          })
                        }
                      />
                    </div>
                  </div>
                  <button
                    className="danger button-compact"
                    onClick={() =>
                      onProfileChange({
                        ...profile,
                        projects: profile.projects.filter((_, itemIndex) => itemIndex !== index)
                      })
                    }
                    disabled={profile.projects.length === 1}
                  >
                    删除项目
                  </button>
                </div>
              ))}
            </div>
          </section>

          <div className="grid-2">
            <section className="profile-section-card">
              <h3>技能</h3>
              <label>技能关键词（逗号分隔）</label>
              <input
                value={profile.skills.join(', ')}
                onChange={(event) =>
                  onProfileChange({
                    ...profile,
                    skills: event.target.value
                      .split(',')
                      .map((item) => item.trim())
                      .filter(Boolean)
                  })
                }
              />
            </section>

            <section className="profile-section-card">
              <div className="database-header database-header-compact">
                <h3>教育经历</h3>
                <button
                  className="secondary button-compact"
                  onClick={() =>
                    onProfileChange({
                      ...profile,
                      education: [...profile.education, { school: '', degree: '', major: '', start: '', end: '' }]
                    })
                  }
                >
                  新增教育
                </button>
              </div>
              <div className="profile-stack-list">
                {profile.education.map((education, index) => (
                  <div key={`${education.school}-${index}`} className="profile-nested-card">
                    <label>学校</label>
                    <input
                      value={education.school}
                      onChange={(event) =>
                        onProfileChange({
                          ...profile,
                          education: updateArrayItem(profile.education, index, { ...education, school: event.target.value })
                        })
                      }
                    />
                    <label>学位</label>
                    <input
                      value={education.degree}
                      onChange={(event) =>
                        onProfileChange({
                          ...profile,
                          education: updateArrayItem(profile.education, index, { ...education, degree: event.target.value })
                        })
                      }
                    />
                    <label>专业</label>
                    <input
                      value={education.major ?? ''}
                      onChange={(event) =>
                        onProfileChange({
                          ...profile,
                          education: updateArrayItem(profile.education, index, { ...education, major: event.target.value })
                        })
                      }
                    />
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>

        {showProfileJson ? (
          <div className="profile-json-panel">
            <label>Profile JSON</label>
            <textarea value={profileText} onChange={(event) => onProfileTextChange(event.target.value)} />
            {profileJsonError ? <div className="form-error">{profileJsonError}</div> : null}
            <div className="inline compact-actions">
              <button className="secondary button-compact" onClick={onApplyProfileJson}>
                从 JSON 应用到表单
              </button>
            </div>
          </div>
        ) : null}
      </PanelShell>
    </section>
  );
}

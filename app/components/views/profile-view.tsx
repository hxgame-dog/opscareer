import { SectionHeader } from '@/app/components/ui/section-header';
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
    <section className="content-stack">
      <article className="panel panel-tight">
        <SectionHeader eyebrow="Profile Settings" title="基础配置" />
        <div className="grid-3">
          <div>
            <label>输出语言</label>
            <select value={resumeLanguage} onChange={(e) => onResumeLanguageChange(e.target.value as Language)}>
              <option value="zh-CN">中文</option>
              <option value="en-US">English</option>
            </select>
          </div>
          <div>
            <label>简历风格</label>
            <input value={style} onChange={(e) => onStyleChange(e.target.value)} />
          </div>
          <div>
            <label>目标级别</label>
            <input value={targetLevel} onChange={(e) => onTargetLevelChange(e.target.value)} />
          </div>
        </div>
      </article>

      <article className="panel panel-tight">
        <SectionHeader
          eyebrow="Profile Form"
          title="个人档案"
          actions={
            <div className="inline compact-actions">
            <button className="ghost button-compact" onClick={onToggleProfileJson}>
              {showProfileJson ? '收起 JSON' : '高级 JSON'}
            </button>
            <button className="secondary button-compact" onClick={onResetProfile}>
              重置示例
            </button>
            </div>
          }
        />

        <div className="profile-sections">
          <section className="profile-section-card">
            <h3>基本信息</h3>
            <div className="grid-2">
              <div>
                <label>姓名</label>
                <input
                  value={profile.basics.name}
                  onChange={(e) => onProfileChange({ ...profile, basics: { ...profile.basics, name: e.target.value } })}
                />
              </div>
              <div>
                <label>邮箱</label>
                <input
                  value={profile.basics.email}
                  onChange={(e) => onProfileChange({ ...profile, basics: { ...profile.basics, email: e.target.value } })}
                />
              </div>
              <div>
                <label>电话</label>
                <input
                  value={profile.basics.phone ?? ''}
                  onChange={(e) => onProfileChange({ ...profile, basics: { ...profile.basics, phone: e.target.value } })}
                />
              </div>
              <div>
                <label>地点</label>
                <input
                  value={profile.basics.location ?? ''}
                  onChange={(e) => onProfileChange({ ...profile, basics: { ...profile.basics, location: e.target.value } })}
                />
              </div>
              <div>
                <label>工作年限</label>
                <input
                  type="number"
                  min="0"
                  value={profile.basics.yearsOfExperience ?? 0}
                  onChange={(e) =>
                    onProfileChange({
                      ...profile,
                      basics: { ...profile.basics, yearsOfExperience: Number(e.target.value) || 0 }
                    })
                  }
                />
              </div>
              <div className="profile-full-span">
                <label>个人摘要</label>
                <textarea
                  value={profile.basics.summary}
                  onChange={(e) => onProfileChange({ ...profile, basics: { ...profile.basics, summary: e.target.value } })}
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
                        onChange={(e) =>
                          onProfileChange({
                            ...profile,
                            experiences: updateArrayItem(profile.experiences, index, {
                              ...experience,
                              company: e.target.value
                            })
                          })
                        }
                      />
                    </div>
                    <div>
                      <label>岗位</label>
                      <input
                        value={experience.role}
                        onChange={(e) =>
                          onProfileChange({
                            ...profile,
                            experiences: updateArrayItem(profile.experiences, index, {
                              ...experience,
                              role: e.target.value
                            })
                          })
                        }
                      />
                    </div>
                    <div>
                      <label>开始时间</label>
                      <input
                        value={experience.start}
                        onChange={(e) =>
                          onProfileChange({
                            ...profile,
                            experiences: updateArrayItem(profile.experiences, index, {
                              ...experience,
                              start: e.target.value
                            })
                          })
                        }
                      />
                    </div>
                    <div>
                      <label>结束时间</label>
                      <input
                        value={experience.end ?? ''}
                        onChange={(e) =>
                          onProfileChange({
                            ...profile,
                            experiences: updateArrayItem(profile.experiences, index, {
                              ...experience,
                              end: e.target.value
                            })
                          })
                        }
                      />
                    </div>
                    <div className="profile-full-span">
                      <label>成就亮点（每行一条）</label>
                      <textarea
                        value={experience.achievements.join('\n')}
                        onChange={(e) =>
                          onProfileChange({
                            ...profile,
                            experiences: updateArrayItem(profile.experiences, index, {
                              ...experience,
                              achievements: e.target.value.split('\n').map((item) => item.trim()).filter(Boolean)
                            })
                          })
                        }
                      />
                    </div>
                    <div className="profile-full-span">
                      <label>技术栈（逗号分隔）</label>
                      <input
                        value={(experience.techStack ?? []).join(', ')}
                        onChange={(e) =>
                          onProfileChange({
                            ...profile,
                            experiences: updateArrayItem(profile.experiences, index, {
                              ...experience,
                              techStack: e.target.value.split(',').map((item) => item.trim()).filter(Boolean)
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
                        onChange={(e) =>
                          onProfileChange({
                            ...profile,
                            projects: updateArrayItem(profile.projects, index, { ...project, name: e.target.value })
                          })
                        }
                      />
                    </div>
                    <div>
                      <label>角色</label>
                      <input
                        value={project.role ?? ''}
                        onChange={(e) =>
                          onProfileChange({
                            ...profile,
                            projects: updateArrayItem(profile.projects, index, { ...project, role: e.target.value })
                          })
                        }
                      />
                    </div>
                    <div className="profile-full-span">
                      <label>项目概述</label>
                      <textarea
                        value={project.summary}
                        onChange={(e) =>
                          onProfileChange({
                            ...profile,
                            projects: updateArrayItem(profile.projects, index, { ...project, summary: e.target.value })
                          })
                        }
                      />
                    </div>
                    <div className="profile-full-span">
                      <label>项目亮点（每行一条）</label>
                      <textarea
                        value={project.highlights.join('\n')}
                        onChange={(e) =>
                          onProfileChange({
                            ...profile,
                            projects: updateArrayItem(profile.projects, index, {
                              ...project,
                              highlights: e.target.value.split('\n').map((item) => item.trim()).filter(Boolean)
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
                onChange={(e) =>
                  onProfileChange({
                    ...profile,
                    skills: e.target.value.split(',').map((item) => item.trim()).filter(Boolean)
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
                      onChange={(e) =>
                        onProfileChange({
                          ...profile,
                          education: updateArrayItem(profile.education, index, { ...education, school: e.target.value })
                        })
                      }
                    />
                    <label>学位</label>
                    <input
                      value={education.degree}
                      onChange={(e) =>
                        onProfileChange({
                          ...profile,
                          education: updateArrayItem(profile.education, index, { ...education, degree: e.target.value })
                        })
                      }
                    />
                    <label>专业</label>
                    <input
                      value={education.major ?? ''}
                      onChange={(e) =>
                        onProfileChange({
                          ...profile,
                          education: updateArrayItem(profile.education, index, { ...education, major: e.target.value })
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
            <textarea value={profileText} onChange={(e) => onProfileTextChange(e.target.value)} />
            {profileJsonError ? <div className="form-error">{profileJsonError}</div> : null}
            <div className="inline compact-actions">
              <button className="secondary button-compact" onClick={onApplyProfileJson}>
                从 JSON 应用到表单
              </button>
            </div>
          </div>
        ) : null}

        <div className="inline compact-actions" style={{ marginTop: 16 }}>
          <button className="button-compact" onClick={onGenerateResume} disabled={isGeneratingResume}>
            {isGeneratingResume ? '生成中...' : '用主档生成简历'}
          </button>
          <button className="secondary button-compact" onClick={onGoResumes}>
            去简历中心继续编辑
          </button>
        </div>
      </article>
    </section>
  );
}

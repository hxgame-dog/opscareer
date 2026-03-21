'use client';

import {
  buildResumePreviewPages,
  getBuilderSummaryPlaceholder,
  getResumePreviewVariant,
  type BuilderIdentity,
  type BuilderProfile
} from '@/lib/resume-builder';

type ResumePreviewProps = {
  identity: BuilderIdentity | null;
  targetRole: string;
  profile: BuilderProfile;
};

function splitBullets(text: string) {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function withFallback(items: string[], placeholder: string) {
  return items.length > 0 ? items : [placeholder];
}

export function ResumePreview({ identity, targetRole, profile }: ResumePreviewProps) {
  const variant = getResumePreviewVariant(targetRole);
  const summary = profile.basics.summary || getBuilderSummaryPlaceholder(identity, targetRole, variant);
  const pages = buildResumePreviewPages(profile, summary, variant);

  return (
    <section className="resume-preview-stage">
      <div className="resume-preview-pages">
        {pages.map((page) => (
          <div key={`resume-page-${page.page}`} className="resume-preview-paper">
            {page.page === 1 ? (
              <header className="resume-paper-header">
                <div>
                  <h1>{profile.basics.name || '你的姓名'}</h1>
                  <p>{targetRole || '目标岗位待确定'}</p>
                  <div className="resume-paper-header-tags">
                    {identity ? <span>{identity}</span> : null}
                    {profile.basics.yearsOfExperience ? <span>{profile.basics.yearsOfExperience} 年经验</span> : null}
                    <span>{variant === 'technical' ? '技术向模板' : variant === 'business' ? '业务向模板' : '通用模板'}</span>
                  </div>
                </div>
                <div className="resume-paper-contact">
                  <span>{profile.basics.email}</span>
                  {profile.basics.phone ? <span>{profile.basics.phone}</span> : null}
                  {profile.basics.location ? <span>{profile.basics.location}</span> : null}
                </div>
              </header>
            ) : (
              <div className="resume-paper-page-counter">第 {page.page} 页</div>
            )}

            {page.summary ? (
              <section className="resume-paper-section">
                <h2>个人摘要</h2>
                <p className="resume-paper-paragraph">{page.summary}</p>
              </section>
            ) : null}

            {page.experiences.items.length > 0 ? (
              <section className={`resume-paper-section resume-paper-section-${variant}`}>
                <h2>{page.experiences.title}</h2>
                <div className="resume-paper-stack">
                  {page.experiences.items.map((item, index) => (
                    <article key={`${page.page}-${item.company}-${index}`} className="resume-paper-item">
                      <div className="resume-paper-item-head">
                        <strong>{item.company || '公司名称'}</strong>
                        <span>{item.role || '岗位名称'}</span>
                        <span>{[item.start, item.end].filter(Boolean).join(' - ') || '时间待填写'}</span>
                      </div>
                      {variant === 'technical' && item.techStack.length > 0 ? (
                        <div className="resume-paper-techstack">
                          {item.techStack.map((skill) => (
                            <span key={`${page.page}-${item.company}-${skill}`}>{skill}</span>
                          ))}
                        </div>
                      ) : null}
                      <ul>
                        {withFallback(splitBullets(item.polishedDraft || item.draft), '在左侧补充这段经历的职责、动作和结果。').map((bullet) => (
                          <li key={bullet}>{bullet}</li>
                        ))}
                      </ul>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}

            {page.projects.items.length > 0 ? (
              <section className={`resume-paper-section resume-paper-section-${variant}`}>
                <h2>{page.projects.title}</h2>
                <div className="resume-paper-stack">
                  {page.projects.items.map((item, index) => (
                    <article key={`${page.page}-${item.name}-${index}`} className="resume-paper-item">
                      <div className="resume-paper-item-head">
                        <strong>{item.name || '项目名称'}</strong>
                        <span>{item.role || '项目角色'}</span>
                      </div>
                      {item.summary ? (
                        <p className={`resume-paper-paragraph ${variant === 'business' ? 'resume-paper-summary-callout' : ''}`}>
                          {item.summary}
                        </p>
                      ) : null}
                      <ul>
                        {withFallback(splitBullets(item.polishedDraft || item.draft), '在左侧补充项目亮点，突出动作和量化结果。').map((bullet) => (
                          <li key={bullet}>{bullet}</li>
                        ))}
                      </ul>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}

            {page.education.items.length > 0 ? (
              <section className={`resume-paper-section resume-paper-section-${variant}`}>
                <h2>{page.education.title}</h2>
                <div className="resume-paper-stack">
                  {page.education.items.map((item, index) => (
                    <article key={`${page.page}-${item.school}-${index}`} className="resume-paper-item">
                      <div className="resume-paper-item-head">
                        <strong>{item.school || '学校名称'}</strong>
                        <span>{[item.degree, item.major].filter(Boolean).join(' · ')}</span>
                        <span>{[item.start, item.end].filter(Boolean).join(' - ')}</span>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}

            {page.skills.length > 0 ? (
              <section className={`resume-paper-section resume-paper-section-${variant}`}>
                <h2>技能</h2>
                <div className="resume-paper-skills">
                  {withFallback(page.skills, '补充关键技能').map((skill) => (
                    <span key={`${page.page}-${skill}`}>{skill}</span>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}

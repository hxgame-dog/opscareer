import { getResumeTheme } from '@/lib/resume-themes';
import { ResumeDraft, ResumeTheme } from '@/types/domain';

export function resumeToMarkdown(resume: ResumeDraft, themeId: ResumeTheme = 'CLASSIC') {
  const theme = getResumeTheme(themeId);
  const sections: string[] = [];
  sections.push(`# ${resume.headline}`);
  sections.push(`\n## 个人摘要\n${resume.summary}`);
  sections.push(`\n## 核心技能\n${resume.skills.map((v) => `- ${v}`).join('\n')}`);
  sections.push(
    `\n## ${theme.sectionLabel}\n${resume.experiences
      .map(
        (exp) => `### ${exp.role} | ${exp.company} (${exp.period})\n${exp.bullets.map((b) => `- ${b}`).join('\n')}`
      )
      .join('\n\n')}`
  );
  sections.push(
    `\n## 项目经历\n${resume.projects
      .map((p) => `### ${p.name}\n${p.bullets.map((b) => `- ${b}`).join('\n')}`)
      .join('\n\n')}`
  );
  sections.push(
    `\n## 教育经历\n${resume.education.map((e) => `- ${e.school} | ${e.detail}`).join('\n')}`
  );

  return sections.join('\n');
}

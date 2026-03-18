import { ResumeDraft } from '@/types/domain';

function normalizeLines(markdown: string) {
  return markdown
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trimEnd());
}

function sectionContent(lines: string[], heading: string) {
  const headingIndex = lines.findIndex((line) => line.trim() === heading);
  if (headingIndex < 0) return [];

  const nextHeadingIndex = lines.findIndex(
    (line, index) => index > headingIndex && /^##\s+/.test(line.trim())
  );

  return lines.slice(headingIndex + 1, nextHeadingIndex >= 0 ? nextHeadingIndex : undefined);
}

function collectBullets(lines: string[]) {
  return lines
    .map((line) => line.trim())
    .filter((line) => line.startsWith('- '))
    .map((line) => line.slice(2).trim())
    .filter(Boolean);
}

function parseExperiences(lines: string[]) {
  const items: ResumeDraft['experiences'] = [];
  let current: ResumeDraft['experiences'][number] | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    if (line.startsWith('### ')) {
      if (current) items.push(current);
      const header = line.slice(4).trim();
      const match = header.match(/^(.*?)\s+\|\s+(.*?)\s+\((.*?)\)$/);
      current = {
        role: match?.[1]?.trim() ?? header,
        company: match?.[2]?.trim() ?? '',
        period: match?.[3]?.trim() ?? '',
        bullets: []
      };
      continue;
    }

    if (line.startsWith('- ') && current) {
      current.bullets.push(line.slice(2).trim());
    }
  }

  if (current) items.push(current);
  return items;
}

function parseProjects(lines: string[]) {
  const items: ResumeDraft['projects'] = [];
  let current: ResumeDraft['projects'][number] | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    if (line.startsWith('### ')) {
      if (current) items.push(current);
      current = {
        name: line.slice(4).trim(),
        bullets: []
      };
      continue;
    }

    if (line.startsWith('- ') && current) {
      current.bullets.push(line.slice(2).trim());
    }
  }

  if (current) items.push(current);
  return items;
}

function parseEducation(lines: string[]) {
  return collectBullets(lines).map((line) => {
    const [school, ...detailParts] = line.split('|');
    return {
      school: school?.trim() ?? '',
      detail: detailParts.join('|').trim()
    };
  });
}

export function markdownToResumeDraft(markdown: string): ResumeDraft {
  const lines = normalizeLines(markdown);
  const headline = lines.find((line) => line.startsWith('# '))?.slice(2).trim() ?? '未命名简历';

  const summaryLines = sectionContent(lines, '## 个人摘要').filter((line) => line.trim() && !line.startsWith('## '));
  const skills = collectBullets(sectionContent(lines, '## 核心技能'));

  const experienceHeadingIndex = lines.findIndex((line) => /^##\s+/.test(line) && line.includes('经历'));
  const experienceHeading =
    experienceHeadingIndex >= 0 ? lines[experienceHeadingIndex].trim() : '## 工作经历';
  const experiences = parseExperiences(sectionContent(lines, experienceHeading));
  const projects = parseProjects(sectionContent(lines, '## 项目经历'));
  const education = parseEducation(sectionContent(lines, '## 教育经历'));

  return {
    headline,
    summary: summaryLines.join('\n').trim(),
    skills,
    experiences,
    projects,
    education
  };
}

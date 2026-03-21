import type { Language, ProfileInput } from '@/types/domain';

export type BuilderIdentity = '学生' | '职场新人' | '资深职场人';
export type ResumePreviewVariant = 'technical' | 'business' | 'general';

export interface BuilderHeroCopy {
  eyebrow: string;
  title: string;
  description: string;
}

export interface BuilderSectionStats {
  experiences: number;
  projects: number;
  skills: number;
  education: number;
  completedSections: number;
}

export interface BuilderExperience {
  company: string;
  role: string;
  start: string;
  end?: string;
  techStack: string[];
  draft: string;
  polishedDraft: string;
}

export interface BuilderProject {
  name: string;
  role?: string;
  summary: string;
  draft: string;
  polishedDraft: string;
}

export interface BuilderProfile {
  basics: ProfileInput['basics'];
  experiences: BuilderExperience[];
  projects: BuilderProject[];
  skills: string[];
  education: ProfileInput['education'];
}

function joinLines(lines: string[]) {
  return lines.filter((line) => line.trim()).join('\n');
}

function toLines(text: string) {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

export function createBuilderProfile(profile: ProfileInput): BuilderProfile {
  return {
    basics: profile.basics,
    experiences: profile.experiences.map((item) => ({
      company: item.company,
      role: item.role,
      start: item.start,
      end: item.end,
      techStack: item.techStack ?? [],
      draft: joinLines(item.achievements),
      polishedDraft: ''
    })),
    projects: profile.projects.map((item) => ({
      name: item.name,
      role: item.role,
      summary: item.summary,
      draft: joinLines(item.highlights),
      polishedDraft: ''
    })),
    skills: profile.skills,
    education: profile.education
  };
}

export function toProfileInput(builder: BuilderProfile, language: Language): ProfileInput {
  return {
    basics: builder.basics,
    experiences: builder.experiences.map((item) => ({
      company: item.company,
      role: item.role,
      start: item.start,
      end: item.end,
      achievements: toLines(item.polishedDraft || item.draft),
      techStack: item.techStack
    })),
    projects: builder.projects.map((item) => ({
      name: item.name,
      role: item.role,
      summary: item.summary,
      highlights: toLines(item.polishedDraft || item.draft)
    })),
    skills: builder.skills,
    education: builder.education,
    language
  };
}

export function getResumePreviewVariant(targetRole: string): ResumePreviewVariant {
  const normalized = targetRole.trim().toLowerCase();
  if (!normalized) return 'general';

  if (
    ['开发', '后端', '前端', '全栈', '架构', 'sre', '运维', '平台', '测试', 'data engineer', 'backend'].some((keyword) =>
      normalized.includes(keyword)
    )
  ) {
    return 'technical';
  }

  if (['运营', '产品', '策略', '增长', '市场', '销售', 'business', 'product'].some((keyword) => normalized.includes(keyword))) {
    return 'business';
  }

  return 'general';
}

export function getBuilderHeroCopy(
  step: 'wizard-identity' | 'wizard-role' | 'editor',
  identity: BuilderIdentity | null,
  targetRole: string
): BuilderHeroCopy {
  if (step === 'wizard-identity') {
    return {
      eyebrow: 'Onboarding',
      title: '先对齐这次简历的求职语境',
      description: '先确认你的当前身份和目标岗位，我们再用同一套上下文去润色经历、组织摘要和生成投递版简历。'
    };
  }

  if (step === 'wizard-role') {
    return {
      eyebrow: 'Target role',
      title: '锁定这次要打的岗位方向',
      description: '岗位会直接影响 STAR 润色的语气、关键词优先级和右侧预览的内容重心。'
    };
  }

  return {
    eyebrow: 'Resume builder',
    title: identity && targetRole ? `${identity} · ${targetRole} 简历工作台` : '开始打磨你的投递版简历',
    description: '左侧写内容、右侧看纸面效果。先把白话草稿写出来，再用 AI 深度润色成可投递的表达。'
  };
}

export function getBuilderSectionStats(profile: BuilderProfile): BuilderSectionStats {
  const completedSections = [
    Boolean(profile.basics.name && profile.basics.email),
    profile.education.some((item) => item.school || item.degree || item.major),
    profile.experiences.some((item) => item.company || item.role || item.draft || item.polishedDraft),
    profile.projects.some((item) => item.name || item.summary || item.draft || item.polishedDraft),
    profile.skills.length > 0
  ].filter(Boolean).length;

  return {
    experiences: profile.experiences.length,
    projects: profile.projects.length,
    skills: profile.skills.length,
    education: profile.education.length,
    completedSections
  };
}

export function getBuilderSummaryPlaceholder(identity: BuilderIdentity | null, targetRole: string, variant: ResumePreviewVariant) {
  if (variant === 'technical') {
    return identity
      ? `${identity}，正在整理与 ${targetRole || '技术岗位'} 相关的核心经历，建议突出系统稳定性、工程深度和量化成果。`
      : `正在整理与 ${targetRole || '技术岗位'} 相关的核心经历，建议突出系统稳定性、工程深度和量化成果。`;
  }

  if (variant === 'business') {
    return identity
      ? `${identity}，正在整理与 ${targetRole || '业务岗位'} 相关的项目与成果，建议强调增长、协作和关键数据指标。`
      : `正在整理与 ${targetRole || '业务岗位'} 相关的项目与成果，建议强调增长、协作和关键数据指标。`;
  }

  return identity
    ? `${identity}，正在整理一版更完整的投递简历，建议先确认核心经历、关键项目和能体现结果的指标。`
    : '正在整理一版更完整的投递简历，建议先确认核心经历、关键项目和能体现结果的指标。';
}

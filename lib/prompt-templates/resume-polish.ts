import type { Language } from '@/types/domain';
import type { BuilderIdentity } from '@/lib/resume-builder';

type ResumePolishPromptParams = {
  sectionType: 'experience' | 'project';
  identity: BuilderIdentity;
  targetRole: string;
  language: Language;
  text: string;
};

export function buildResumePolishPrompt(params: ResumePolishPromptParams) {
  const sectionLabel = params.sectionType === 'experience' ? '工作经历' : '项目经历';
  const languageRule =
    params.language === 'en-US'
      ? 'Output polished resume bullets in fluent English, but keep the structure concise and recruiter-friendly.'
      : '请用专业自然的中文输出，符合招聘经理阅读习惯。';

  return [
    '你是一位资深招聘经理和简历顾问。',
    `候选人当前身份：${params.identity}。`,
    `候选人目标岗位：${params.targetRole}。`,
    `你需要把下面这段${sectionLabel}白话草稿，重写成更适合简历的专业表达。`,
    '重写要求：',
    '1. 严格遵循 STAR 思路组织表达，但不要显式写出 STAR 标题。',
    '2. 语气必须专业、克制、可信，不要夸张。',
    '3. 如果缺少量化结果，请合理插入可后续补充的占位符，例如 XX%、XX 人、XX 万。',
    '4. 优先保留能体现职责、行动、结果、协作方式和业务价值的内容。',
    '5. 输出纯文本，每一行作为一个简历 bullet，不要输出 JSON、Markdown 标题或解释。',
    languageRule,
    '',
    '原始草稿：',
    params.text.trim()
  ].join('\n');
}

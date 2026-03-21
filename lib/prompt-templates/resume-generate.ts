import { getLanguageLabel, getLanguagePrompt } from '@/lib/language';
import { Language, ProfileInput } from '@/types/domain';

type ResumeGenerateContext = {
  identity?: string;
  targetRole?: string;
};

export function buildResumeGeneratePrompt(
  profile: ProfileInput,
  style: string,
  language: Language,
  context?: ResumeGenerateContext
) {
  return `你是资深简历顾问。根据候选人信息生成专业简历草稿。\n\n输出语言: ${getLanguageLabel(language)}\n${getLanguagePrompt(
    language
  )}\n\n风格: ${style}${
    context?.identity || context?.targetRole
      ? `\n\n候选人上下文:\n- 当前身份: ${context?.identity ?? '未指定'}\n- 目标岗位: ${context?.targetRole ?? '未指定'}`
      : ''
  }\n\n候选人信息(JSON):\n${JSON.stringify(
    profile,
    null,
    2
  )}\n\n请仅返回 JSON，结构必须为:\n{\n  "headline": "",\n  "summary": "",\n  "skills": [""],\n  "experiences": [{"company":"","role":"","period":"","bullets":[""]}],\n  "projects": [{"name":"","bullets":[""]}],\n  "education": [{"school":"","detail":""}]\n}`;
}

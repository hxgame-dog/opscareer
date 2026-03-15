import { getLanguageLabel, getLanguagePrompt } from '@/lib/language';
import { Language, ProfileInput } from '@/types/domain';

export function buildResumeGeneratePrompt(profile: ProfileInput, style: string, language: Language) {
  return `你是资深简历顾问。根据候选人信息生成专业简历草稿。\n\n输出语言: ${getLanguageLabel(language)}\n${getLanguagePrompt(
    language
  )}\n\n风格: ${style}\n\n候选人信息(JSON):\n${JSON.stringify(
    profile,
    null,
    2
  )}\n\n请仅返回 JSON，结构必须为:\n{\n  "headline": "",\n  "summary": "",\n  "skills": [""],\n  "experiences": [{"company":"","role":"","period":"","bullets":[""]}],\n  "projects": [{"name":"","bullets":[""]}],\n  "education": [{"school":"","detail":""}]\n}`;
}

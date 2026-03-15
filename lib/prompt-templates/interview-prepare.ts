import { getLanguageLabel, getLanguagePrompt } from '@/lib/language';
import { Language } from '@/types/domain';

export function buildInterviewPreparePrompt(jdText: string, targetLevel: string, language: Language) {
  return `你是面试教练。根据岗位 JD 为候选人生成面试建议。\n\n输出语言: ${getLanguageLabel(language)}\n${getLanguagePrompt(
    language
  )}\n\n目标级别: ${targetLevel}\nJD:\n${jdText}\n\n请仅返回 JSON:\n{\n  "strategy": "",\n  "qa": [\n    {"question":"","answer":"","followUp":""}\n  ]\n}`;
}

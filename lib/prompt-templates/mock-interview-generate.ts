import { getLanguageLabel, getLanguagePrompt } from '@/lib/language';
import { Language } from '@/types/domain';

export function buildMockInterviewGeneratePrompt(jdText: string, targetLevel: string, questionCount: number, language: Language) {
  return `你是资深技术面试官。请根据岗位 JD 生成一套逐题模拟面试题，覆盖基础经历、项目深挖、技术能力、场景题、沟通协作。题目要贴近真实面试，难度匹配目标级别。\n\n输出语言: ${getLanguageLabel(
    language
  )}\n${getLanguagePrompt(language)}\n\n目标级别: ${targetLevel}\n题目数量: ${questionCount}\nJD:\n${jdText}\n\n请仅返回 JSON:\n{\n  "questions": [\n    {\n      "order": 1,\n      "category": "EXPERIENCE",\n      "question": "",\n      "intent": "",\n      "difficulty": "medium"\n    }\n  ]\n}`;
}

import { getLanguageLabel, getLanguagePrompt } from '@/lib/language';
import { Language, MockInterviewQuestion } from '@/types/domain';

export function buildMockInterviewEvaluatePrompt(params: {
  jdText: string;
  language: Language;
  question: Pick<MockInterviewQuestion, 'category' | 'question' | 'intent' | 'difficulty'>;
  transcript: string;
}) {
  return `你是严格但建设性的模拟面试官。请基于岗位 JD、当前题目和候选人的回答，对本题进行评分与反馈。\n\n输出语言: ${getLanguageLabel(
    params.language
  )}\n${getLanguagePrompt(params.language)}\n\nJD:\n${params.jdText}\n\n题目分类: ${params.question.category}\n题目难度: ${params.question.difficulty}\n题目意图: ${
    params.question.intent
  }\n题目内容:\n${params.question.question}\n\n候选人回答(转写文本):\n${params.transcript}\n\n请仅返回 JSON:\n{\n  "score": 0,\n  "dimensionScores": {\n    "relevance": 0,\n    "technicalDepth": 0,\n    "structure": 0,\n    "jobFit": 0,\n    "evidence": 0\n  },\n  "strengths": [""],\n  "gaps": [""],\n  "improvedAnswer": "",\n  "followUpAdvice": ""\n}`;
}

import { getLanguageLabel, getLanguagePrompt } from '@/lib/language';
import { Language } from '@/types/domain';

export function buildMockInterviewSummaryPrompt(params: {
  jdText: string;
  language: Language;
  targetLevel: string;
  turnsJson: string;
}) {
  return `你是模拟面试复盘官。请基于整场模拟面试的逐题结果，输出整场表现总结。\n\n输出语言: ${getLanguageLabel(
    params.language
  )}\n${getLanguagePrompt(params.language)}\n\n目标级别: ${params.targetLevel}\nJD:\n${params.jdText}\n\n逐题结果(JSON):\n${params.turnsJson}\n\n请仅返回 JSON:\n{\n  "overallScore": 0,\n  "dimensionScores": {\n    "relevance": 0,\n    "technicalDepth": 0,\n    "structure": 0,\n    "jobFit": 0,\n    "evidence": 0\n  },\n  "performanceLevel": "",\n  "topStrengths": [""],\n  "topRisks": [""],\n  "recommendedTopics": [""]\n}`;
}

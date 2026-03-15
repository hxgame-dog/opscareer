import { getLanguageLabel, getLanguagePrompt } from '@/lib/language';
import { Language } from '@/types/domain';

export function buildResumeOptimizePrompt(resumeMarkdown: string, jdText: string, language: Language) {
  return `你是求职优化助手。目标是根据 JD 优化简历并输出诊断。\n\n输出语言: ${getLanguageLabel(language)}\n${getLanguagePrompt(
    language
  )}\n\nJD:\n${jdText}\n\n当前简历(Markdown):\n${resumeMarkdown}\n\n请仅返回 JSON，结构:\n{\n  "optimizedResume": {"headline":"","summary":"","skills":[""],"experiences":[{"company":"","role":"","period":"","bullets":[""]}],"projects":[{"name":"","bullets":[""]}],"education":[{"school":"","detail":""}]},\n  "diagnosis": {\n    "score": 0,\n    "dimensions": {"keywordMatch":0,"relevance":0,"quantifiedImpact":0,"atsCompatibility":0,"riskLevel":0},\n    "strengths": [""],\n    "gaps": [""],\n    "suggestions": [""],\n    "riskFlags": [""]\n  },\n  "keywords": [""]\n}`;
}

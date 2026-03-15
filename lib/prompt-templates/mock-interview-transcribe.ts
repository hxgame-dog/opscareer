import { getLanguageLabel } from '@/lib/language';
import { Language } from '@/types/domain';

export function buildMockInterviewTranscribePrompt(language: Language) {
  return `请将这段模拟面试回答音频准确转写为文本。不要总结，不要润色，不要补充不存在的内容。输出语言保持为音频原始语言；若夹杂口语停顿词，可适度保留。当前优先识别语言: ${getLanguageLabel(
    language
  )}。只返回转写文本本身。`;
}

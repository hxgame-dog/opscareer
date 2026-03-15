import { Language } from '@/types/domain';

export function getLanguageLabel(language: Language) {
  return language === 'en-US' ? 'English' : '中文';
}

export function getLanguagePrompt(language: Language) {
  return language === 'en-US'
    ? 'Output must be fluent professional English suitable for international job applications.'
    : '输出必须是自然专业的中文，适合中文求职场景。';
}

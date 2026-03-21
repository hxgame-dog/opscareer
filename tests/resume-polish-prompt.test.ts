import { describe, expect, it } from 'vitest';
import { buildResumePolishPrompt } from '@/lib/prompt-templates/resume-polish';

describe('buildResumePolishPrompt', () => {
  it('includes identity, target role and STAR rewrite instructions', () => {
    const prompt = buildResumePolishPrompt({
      sectionType: 'experience',
      identity: '资深职场人',
      targetRole: '后端开发',
      language: 'zh-CN',
      text: '我平时做了很多服务稳定性相关的事情，也带着团队处理故障。'
    });

    expect(prompt).toContain('资深职场人');
    expect(prompt).toContain('后端开发');
    expect(prompt).toContain('STAR');
    expect(prompt).toContain('XX%');
    expect(prompt).toContain('不要输出 JSON');
  });
});

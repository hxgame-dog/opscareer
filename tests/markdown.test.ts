import { describe, expect, it } from 'vitest';
import { resumeToMarkdown } from '../lib/markdown';

describe('resumeToMarkdown', () => {
  it('converts resume draft to markdown sections', () => {
    const md = resumeToMarkdown({
      headline: '张三',
      summary: '后端工程师',
      skills: ['Go', 'Kubernetes'],
      experiences: [
        {
          company: 'A 公司',
          role: '工程师',
          period: '2020-2024',
          bullets: ['优化发布流程']
        }
      ],
      projects: [{ name: '平台升级', bullets: ['可用性提升'] }],
      education: [{ school: '某大学', detail: '本科' }]
    });

    expect(md).toContain('# 张三');
    expect(md).toContain('## 核心技能');
    expect(md).toContain('### 工程师 | A 公司');
  });

  it('uses themed section labels when a theme is provided', () => {
    const md = resumeToMarkdown(
      {
        headline: '李四',
        summary: '平台工程师',
        skills: ['TypeScript'],
        experiences: [{ company: 'B 公司', role: '平台工程师', period: '2022-2025', bullets: ['搭建交付平台'] }],
        projects: [],
        education: []
      },
      'EXECUTIVE'
    );

    expect(md).toContain('## 核心战绩');
  });
});

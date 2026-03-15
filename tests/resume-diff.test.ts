import { describe, expect, it } from 'vitest';
import { buildResumeDiff } from '../lib/resume-diff';

describe('buildResumeDiff', () => {
  it('captures summary, skill, experience, and project differences', () => {
    const diff = buildResumeDiff(
      {
        headline: 'A',
        summary: '负责平台稳定性',
        skills: ['Go', 'Kubernetes'],
        experiences: [
          {
            company: '示例科技',
            role: 'SRE',
            period: '2024',
            bullets: ['维护监控系统']
          }
        ],
        projects: [{ name: '平台项目', bullets: ['旧能力'] }],
        education: []
      },
      {
        headline: 'B',
        summary: '负责平台稳定性与成本优化',
        skills: ['Go', 'Kubernetes', 'AWS'],
        experiences: [
          {
            company: '示例科技',
            role: 'SRE',
            period: '2024',
            bullets: ['维护监控系统', '推动成本优化']
          }
        ],
        projects: [{ name: '平台项目', bullets: ['旧能力', '新增自动化'] }],
        education: []
      }
    );

    expect(diff.summary.after).toContain('成本优化');
    expect(diff.skills.added).toEqual(['AWS']);
    expect(diff.experiences[0].addedBullets).toEqual(['推动成本优化']);
    expect(diff.projects[0].addedBullets).toEqual(['新增自动化']);
  });
});

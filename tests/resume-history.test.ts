import { describe, expect, it } from 'vitest';
import { buildResumeHistoryGroups } from '../lib/resume-history';

describe('buildResumeHistoryGroups', () => {
  it('groups resumes by ancestry and sorts versions newest first', () => {
    const groups = buildResumeHistoryGroups([
      {
        id: 'root',
        title: '张三-Resume-v1',
        version: 1,
        theme: 'CLASSIC',
        parentResumeId: null,
        createdAt: new Date('2026-03-01T10:00:00Z'),
        updatedAt: new Date('2026-03-01T10:00:00Z'),
        jobPosting: null
      },
      {
        id: 'child',
        title: '目标公司-高级SRE-optimized',
        version: 2,
        theme: 'EXECUTIVE',
        parentResumeId: 'root',
        createdAt: new Date('2026-03-02T10:00:00Z'),
        updatedAt: new Date('2026-03-02T10:00:00Z'),
        jobPosting: {
          company: '目标公司',
          role: '高级SRE'
        }
      }
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0].rootResumeId).toBe('root');
    expect(groups[0].versions[0].id).toBe('child');
    expect(groups[0].versions[0].targetLabel).toBe('目标公司 · 高级SRE');
  });
});

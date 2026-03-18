import { describe, expect, it } from 'vitest';
import { getWorkspaceViewChrome } from '../lib/workspace-ui';

describe('getWorkspaceViewChrome', () => {
  it('returns task-led metadata for resumes view', () => {
    const chrome = getWorkspaceViewChrome('resumes');

    expect(chrome.eyebrow).toBe('Resume Studio');
    expect(chrome.primaryActionLabel).toBe('生成简历');
    expect(chrome.accent).toBe('indigo');
  });

  it('returns search-led metadata for jobs view', () => {
    const chrome = getWorkspaceViewChrome('jobs');

    expect(chrome.eyebrow).toBe('Job Database');
    expect(chrome.primaryActionLabel).toBe('搜索岗位');
    expect(chrome.accent).toBe('blue');
  });
});

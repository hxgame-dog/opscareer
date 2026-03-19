import { describe, expect, it } from 'vitest';
import {
  getWorkspaceNavigation,
  getWorkspaceViewChrome,
  getWorkspaceViewMeta
} from '../lib/workspace-ui';

describe('getWorkspaceViewChrome', () => {
  it('uses a single brand accent for core work views', () => {
    const chrome = getWorkspaceViewChrome('resumes');

    expect(chrome.eyebrow).toBe('Resume Hub');
    expect(chrome.primaryActionLabel).toBe('继续编辑');
    expect(chrome.accent).toBe('brand');
  });

  it('keeps contextual labels lighter and more document-like', () => {
    const chrome = getWorkspaceViewChrome('jobs');

    expect(chrome.eyebrow).toBe('Job Library');
    expect(chrome.primaryActionLabel).toBe('浏览岗位');
    expect(chrome.secondaryLabel).toBe('岗位数据库');
    expect(chrome.accent).toBe('brand');
  });
});

describe('workspace metadata', () => {
  it('returns notion-like page copy for the home view', () => {
    const meta = getWorkspaceViewMeta('home');

    expect(meta.title).toBe('工作台');
    expect(meta.description).toBe('在一个更安静的主工作区里继续推进简历、岗位和投递。');
  });

  it('returns two-line navigation metadata with chinese label first', () => {
    const navigation = getWorkspaceNavigation();
    const resumes = navigation.find((item) => item.id === 'resumes');

    expect(resumes).toEqual(
      expect.objectContaining({
        label: '简历中心',
        hint: 'Resume hub',
        icon: 'resume'
      })
    );
  });
});

import { describe, expect, it } from 'vitest';
import { normalizeResumeImportPreview } from '../lib/resume-import';

describe('normalizeResumeImportPreview', () => {
  it('fills fallback title and language defaults', () => {
    const preview = normalizeResumeImportPreview({
      filename: 'resume.pdf',
      title: '   ',
      language: undefined,
      theme: 'CLASSIC',
      markdown: '# 张三',
      profile: {
        basics: {
          name: '张三',
          email: 'zhangsan@example.com',
          summary: '后端工程师'
        },
        experiences: [],
        projects: [],
        skills: [],
        education: []
      },
      draft: {
        headline: '张三',
        summary: '后端工程师',
        skills: [],
        experiences: [],
        projects: [],
        education: []
      }
    });

    expect(preview.title).toBe('张三');
    expect(preview.language).toBe('zh-CN');
  });

  it('preserves an explicit title and markdown payload', () => {
    const preview = normalizeResumeImportPreview({
      filename: 'resume.docx',
      title: '我的导入简历',
      language: 'en-US',
      theme: 'EXECUTIVE',
      markdown: '# Jane Doe',
      profile: {
        basics: {
          name: 'Jane Doe',
          email: 'jane@example.com',
          summary: 'Platform engineer'
        },
        experiences: [],
        projects: [],
        skills: ['Go'],
        education: []
      },
      draft: {
        headline: 'Jane Doe',
        summary: 'Platform engineer',
        skills: ['Go'],
        experiences: [],
        projects: [],
        education: []
      }
    });

    expect(preview.title).toBe('我的导入简历');
    expect(preview.markdown).toContain('Jane Doe');
    expect(preview.theme).toBe('EXECUTIVE');
  });
});

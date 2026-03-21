import { describe, expect, it } from 'vitest';
import {
  createBuilderProfile,
  getBuilderHeroCopy,
  getBuilderSectionStats,
  getBuilderSummaryPlaceholder,
  getResumePreviewVariant,
  toProfileInput
} from '@/lib/resume-builder';
import type { ProfileInput } from '@/types/domain';

const baseProfile: ProfileInput = {
  basics: {
    name: '张三',
    email: 'zhangsan@example.com',
    summary: '擅长平台工程和稳定性建设。',
    yearsOfExperience: 5
  },
  experiences: [
    {
      company: '示例科技',
      role: 'SRE 工程师',
      start: '2022-01',
      end: '2025-01',
      achievements: ['负责监控告警体系建设', '推动自动化发布流程改造'],
      techStack: ['Kubernetes', 'Terraform']
    }
  ],
  projects: [
    {
      name: '统一稳定性平台',
      role: '负责人',
      summary: '负责整体规划',
      highlights: ['将 P1 故障数降低 30%', '让跨团队协作效率提升']
    }
  ],
  skills: ['Kubernetes', 'Terraform'],
  education: [{ school: '某大学', degree: '本科', major: '计算机科学' }],
  language: 'zh-CN'
};

describe('resume builder helpers', () => {
  it('hydrates builder profile draft text from existing profile', () => {
    const builder = createBuilderProfile(baseProfile);

    expect(builder.experiences[0].draft).toContain('负责监控告警体系建设');
    expect(builder.experiences[0].draft).toContain('推动自动化发布流程改造');
    expect(builder.projects[0].draft).toContain('将 P1 故障数降低 30%');
  });

  it('converts polished draft text back into profile input arrays', () => {
    const builder = createBuilderProfile(baseProfile);

    builder.experiences[0].polishedDraft = '主导监控体系建设并补齐告警闭环\n推动发布自动化，交付效率提升 XX%';
    builder.projects[0].polishedDraft = '搭建统一稳定性平台，覆盖 XX 个服务\n推动复盘机制标准化，P1 故障下降 XX%';

    const converted = toProfileInput(builder, 'zh-CN');

    expect(converted.experiences[0].achievements).toEqual([
      '主导监控体系建设并补齐告警闭环',
      '推动发布自动化，交付效率提升 XX%'
    ]);
    expect(converted.projects[0].highlights).toEqual([
      '搭建统一稳定性平台，覆盖 XX 个服务',
      '推动复盘机制标准化，P1 故障下降 XX%'
    ]);
  });

  it('derives preview variant from target role', () => {
    expect(getResumePreviewVariant('后端开发')).toBe('technical');
    expect(getResumePreviewVariant('策略运营')).toBe('business');
    expect(getResumePreviewVariant('未知岗位')).toBe('general');
  });

  it('builds builder copy and section stats for the workspace shell', () => {
    const builder = createBuilderProfile(baseProfile);
    const copy = getBuilderHeroCopy('editor', '资深职场人', '后端开发');
    const stats = getBuilderSectionStats(builder);

    expect(copy.title).toContain('资深职场人');
    expect(copy.title).toContain('后端开发');
    expect(stats).toMatchObject({
      experiences: 1,
      projects: 1,
      skills: 2,
      education: 1,
      completedSections: 5
    });
  });

  it('creates role-aware preview placeholder copy', () => {
    expect(getBuilderSummaryPlaceholder('职场新人', '后端开发', 'technical')).toContain('系统稳定性');
    expect(getBuilderSummaryPlaceholder('学生', '策略运营', 'business')).toContain('关键数据指标');
    expect(getBuilderSummaryPlaceholder(null, '', 'general')).toContain('投递简历');
  });
});

import { describe, expect, it } from 'vitest';
import { createBuilderProfile } from '@/lib/resume-builder';
import { DEFAULT_PROFILE } from '@/lib/default-profile';
import {
  getApplicationNextRecommendation,
  getBuilderCompletionGuidance,
  getBuilderPolishHint,
  getHomePrimaryTask,
  getJobNextRecommendation,
  getMockInterviewNextRecommendation,
  getResumeNextRecommendation
} from '@/lib/product-guidance';

describe('product guidance', () => {
  it('prefers resume creation as the first home task', () => {
    expect(
      getHomePrimaryTask({
        resumeGroupCount: 0,
        jdCount: 0,
        applicationCount: 0,
        activeApplicationCount: 0,
        mockInterviewCount: 0,
        recentApplications: [],
        recentMockInterviews: []
      })
    ).toMatchObject({
      action: 'resumes',
      title: '先完成第一份简历'
    });
  });

  it('prefers continuing active applications once the basics exist', () => {
    expect(
      getHomePrimaryTask({
        resumeGroupCount: 1,
        jdCount: 2,
        applicationCount: 2,
        activeApplicationCount: 1,
        mockInterviewCount: 1,
        recentApplications: [{ id: 'app-1', company: '示例公司', role: '产品经理' }],
        recentMockInterviews: []
      })
    ).toMatchObject({
      action: 'application',
      title: '继续推进正在进行中的投递',
      targetId: 'app-1'
    });
  });

  it('summarizes builder completion and next recommendation', () => {
    const profile = createBuilderProfile(DEFAULT_PROFILE);
    profile.basics.name = '张三';
    profile.basics.email = 'zhangsan@example.com';
    profile.basics.summary = '';
    profile.projects = [];
    profile.skills = [];
    profile.experiences[0] = {
      company: '示例公司',
      role: '后端开发',
      start: '2022-01',
      end: '至今',
      techStack: ['Go'],
      draft: '负责服务治理并优化发布链路',
      polishedDraft: ''
    };

    expect(getBuilderCompletionGuidance(profile)).toMatchObject({
      completed: 2,
      total: 5,
      nextTitle: '继续补全项目或摘要'
    });
  });

  it('returns role-aware polish hints', () => {
    expect(getBuilderPolishHint('experience', '后端开发')).toContain('技术');
    expect(getBuilderPolishHint('project', '产品经理')).toContain('结果');
  });

  it('returns next-step recommendations for resumes and jobs', () => {
    expect(getResumeNextRecommendation({ hasResume: true, generatedRecently: true }).title).toContain('按 JD 优化');
    expect(getJobNextRecommendation(true).title).toContain('推进成真实动作');
  });

  it('returns stage-aware next steps for applications', () => {
    expect(getApplicationNextRecommendation({ hasSelectedApplication: false }).title).toContain('先打开一条投递');
    expect(getApplicationNextRecommendation({ hasSelectedApplication: true, status: 'READY' }).title).toContain('真正发出去');
    expect(
      getApplicationNextRecommendation({ hasSelectedApplication: true, status: 'INTERVIEWING', interviewCount: 1 }).title
    ).toContain('记录本轮面试');
  });

  it('returns stage-aware next steps for mock interviews', () => {
    expect(getMockInterviewNextRecommendation({ hasSelectedSession: false }).title).toContain('先开始一场模拟面试');
    expect(
      getMockInterviewNextRecommendation({
        hasSelectedSession: true,
        hasCurrentQuestion: true,
        answeredCount: 1,
        questionCount: 5
      }).title
    ).toContain('先完成当前这道题');
    expect(
      getMockInterviewNextRecommendation({
        hasSelectedSession: true,
        status: 'COMPLETED',
        hasSummary: true
      }).title
    ).toContain('保存这场练习');
  });
});

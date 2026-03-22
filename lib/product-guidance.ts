import type { BuilderProfile } from '@/lib/resume-builder';

type HomePrimaryTaskInput = {
  resumeGroupCount: number;
  jdCount: number;
  applicationCount: number;
  activeApplicationCount: number;
  mockInterviewCount: number;
  recentApplications: Array<{ id: string; company: string; role: string }>;
  recentMockInterviews: Array<{ id: string; company: string; role: string }>;
};

export type HomePrimaryTask =
  | { action: 'resumes' | 'jobs' | 'mock'; title: string; description: string }
  | { action: 'application' | 'mock-session'; title: string; description: string; targetId: string };

export function getHomePrimaryTask(input: HomePrimaryTaskInput): HomePrimaryTask {
  if (input.resumeGroupCount === 0) {
    return {
      action: 'resumes',
      title: '先完成第一份简历',
      description: '把主档整理成第一版可投递简历，后续的 JD 定制和投递都会顺很多。'
    };
  }

  if (input.jdCount === 0) {
    return {
      action: 'jobs',
      title: '先保存目标岗位',
      description: '把目标 JD 放进岗位库，之后优化简历、创建投递和模拟面试都能复用。'
    };
  }

  if (input.applicationCount === 0) {
    return {
      action: 'jobs',
      title: '从 JD 库创建第一条投递',
      description: '把岗位真正推进成投递记录，工作台才会开始形成后续提醒和进展闭环。'
    };
  }

  if (input.activeApplicationCount > 0 && input.recentApplications[0]) {
    return {
      action: 'application',
      title: '继续推进正在进行中的投递',
      description: `${input.recentApplications[0].company} · ${input.recentApplications[0].role} 还有下一步动作值得继续跟进。`,
      targetId: input.recentApplications[0].id
    };
  }

  if (input.mockInterviewCount === 0) {
    return {
      action: 'mock',
      title: '做第一次模拟面试',
      description: '用一场练习快速看到表达、结构和岗位匹配度的问题，再回到简历里修正。'
    };
  }

  if (input.recentMockInterviews[0]) {
    return {
      action: 'mock-session',
      title: '继续上次的模拟面试',
      description: `${input.recentMockInterviews[0].company} · ${input.recentMockInterviews[0].role} 还可以继续补答和复盘。`,
      targetId: input.recentMockInterviews[0].id
    };
  }

  return {
    action: 'jobs',
    title: '回到岗位库继续推进',
    description: '基础资料已经齐了，下一步最值得做的是围绕目标 JD 继续优化和投递。'
  };
}

export function getBuilderCompletionGuidance(profile: BuilderProfile) {
  const checklist = [
    Boolean(profile.basics.name && profile.basics.email),
    Boolean(profile.basics.summary.trim()),
    profile.experiences.some((item) => item.company || item.role || item.draft || item.polishedDraft),
    profile.projects.some((item) => item.name || item.summary || item.draft || item.polishedDraft),
    profile.skills.length > 0
  ];
  const completed = checklist.filter(Boolean).length;
  const total = checklist.length;

  if (!checklist[0]) {
    return { completed, total, nextTitle: '先补全基础信息', nextDescription: '姓名和邮箱是生成第一版简历前最基本的必要项。' };
  }

  if (!checklist[2]) {
    return { completed, total, nextTitle: '先写一段工作经历草稿', nextDescription: '哪怕先用白话写职责和结果，也比空着更容易进入 AI 润色阶段。' };
  }

  if (!checklist[3] || !checklist[1]) {
    return { completed, total, nextTitle: '继续补全项目或摘要', nextDescription: '把代表性的项目和一句简短摘要补齐，右侧纸面感会立刻更完整。' };
  }

  if (!checklist[4]) {
    return { completed, total, nextTitle: '补充关键技能标签', nextDescription: '技能区会影响技术向模板的密度，也方便后续 JD 匹配。' };
  }

  return { completed, total, nextTitle: '可以生成第一版简历了', nextDescription: '主档基础已经齐，可以先生成一版，再按具体 JD 做定制化优化。' };
}

export function getBuilderPolishHint(sectionType: 'experience' | 'project', targetRole: string) {
  const normalized = targetRole.trim().toLowerCase();
  const technical = ['开发', '后端', '前端', '全栈', '架构', 'sre', '运维', '平台', '测试'].some((keyword) =>
    normalized.includes(keyword)
  );
  const business = ['运营', '产品', '策略', '增长', '市场', '销售', 'business', 'product'].some((keyword) =>
    normalized.includes(keyword)
  );

  if (sectionType === 'experience') {
    if (technical) return '适合把白话经历整理成技术岗位能快速扫读的 STAR 表达，突出系统动作和工程结果。';
    if (business) return '适合把职责整理成更有业务结果感的表达，突出协作、策略和量化成果。';
    return '适合把职责和结果整理成更像简历的表达，再按 STAR 法则补齐动作与结果。';
  }

  if (business) return '适合把项目亮点写成更有结果导向的叙事，突出背景、动作、影响和关键指标。';
  if (technical) return '适合把项目亮点整理成更有技术密度的表达，突出方案、动作和最终效果。';
  return '适合把项目亮点打磨成更专业的简历语言，突出动作、结果和量化表达。';
}

export function getResumeNextRecommendation(input: { hasResume: boolean; generatedRecently: boolean }) {
  if (!input.hasResume) {
    return {
      title: '先生成第一版简历',
      description: '主档和纸面预览都准备好后，先生成一个可管理的版本，后续优化和导出都会更顺。'
    };
  }

  if (input.generatedRecently) {
    return {
      title: '下一步：按 JD 优化这版新简历',
      description: '你刚生成了一个新版本，现在最值得做的是对准目标岗位做一次 JD 定制化优化。'
    };
  }

  return {
    title: '下一步：围绕目标岗位继续推进',
    description: '可以继续按 JD 优化、切换模板导出，或者直接回到岗位库创建投递。'
  };
}

export function getJobNextRecommendation(hasSelectedJob: boolean) {
  if (!hasSelectedJob) {
    return {
      title: '先打开一个目标岗位',
      description: '选中一条 JD 后，右侧就会出现这条岗位最适合的下一步动作。'
    };
  }

  return {
    title: '下一步：把岗位推进成真实动作',
    description: '推荐优先做简历优化，然后创建投递；如果已经熟悉岗位，也可以直接开始模拟面试。'
  };
}

export function getApplicationNextRecommendation(input: {
  hasSelectedApplication: boolean;
  status?: string;
  interviewCount?: number;
}) {
  if (!input.hasSelectedApplication) {
    return {
      title: '先打开一条投递',
      description: '选中一条投递后，这里会根据当前阶段推荐最值得继续推进的下一步动作。'
    };
  }

  if (input.status === 'SAVED' || input.status === 'READY') {
    return {
      title: '下一步：把这条投递真正发出去',
      description: '建议先确认简历版本，再把状态推进到已投递，后续提醒和面试记录就能跟上。'
    };
  }

  if (input.status === 'APPLIED' || input.status === 'SCREENING') {
    return {
      title: '下一步：准备面试并留下跟进动作',
      description: '这个阶段最值得做的是提前练一轮模拟面试，并在详情里补上下一步和提醒时间。'
    };
  }

  if (input.status === 'INTERVIEWING') {
    return {
      title: '下一步：记录本轮面试并继续训练',
      description:
        input.interviewCount && input.interviewCount > 0
          ? '已经进入面试中，建议及时补面试记录，再围绕岗位继续做模拟练习。'
          : '已经进入面试阶段，建议先创建一条面试记录，再做一次针对性模拟。'
    };
  }

  return {
    title: '下一步：补齐收尾与复盘',
    description: '这条投递已经进入收尾阶段，建议回看详情、补全备注或复盘，再回到岗位库继续推进新的机会。'
  };
}

export function getMockInterviewNextRecommendation(input: {
  hasSelectedSession: boolean;
  status?: string;
  hasCurrentQuestion?: boolean;
  hasSummary?: boolean;
  answeredCount?: number;
  questionCount?: number;
}) {
  if (!input.hasSelectedSession) {
    return {
      title: '先开始一场模拟面试',
      description: '选一个目标岗位开一场练习，会比直接看问题列表更容易进入训练状态。'
    };
  }

  if (input.hasCurrentQuestion) {
    return {
      title: '下一步：先完成当前这道题',
      description: `当前会话已答 ${input.answeredCount ?? 0}/${input.questionCount ?? 0} 题，先把眼前这道题讲顺，再看总评会更有价值。`
    };
  }

  if (!input.hasSummary && input.status === 'COMPLETED') {
    return {
      title: '下一步：回看整场总评并沉淀记录',
      description: '本轮已经完成，建议先看亮点和风险点，再保存到面试记录，形成真正可复用的复盘。'
    };
  }

  if (input.hasSummary) {
    return {
      title: '下一步：保存这场练习并继续迭代',
      description: '你已经拿到总评，建议先沉淀到面试记录，再回到主档或 JD 继续修正表达。'
    };
  }

  return {
    title: '下一步：继续完成整场练习',
    description: '优先把剩余题目答完，完成后再统一看总评和建议，信息会更完整。'
  };
}

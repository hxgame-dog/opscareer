export type WorkspaceView =
  | 'home'
  | 'profile'
  | 'resumes'
  | 'jobs'
  | 'mock'
  | 'applications'
  | 'interviews'
  | 'settings';

export type WorkspaceAccent = 'brand' | 'neutral' | 'success' | 'warn';

export type WorkspaceViewChrome = {
  eyebrow: string;
  accent: WorkspaceAccent;
  primaryActionLabel: string;
  secondaryLabel: string;
};

export type WorkspaceViewMeta = {
  title: string;
  description: string;
};

export type WorkspaceNavigationItem = {
  id: WorkspaceView;
  label: string;
  hint: string;
  icon: 'home' | 'profile' | 'resume' | 'job' | 'mock' | 'application' | 'interview' | 'settings';
};

const viewChrome: Record<WorkspaceView, WorkspaceViewChrome> = {
  home: {
    eyebrow: 'Workspace',
    accent: 'brand',
    primaryActionLabel: '继续推进',
    secondaryLabel: '今日任务'
  },
  profile: {
    eyebrow: 'Profile',
    accent: 'neutral',
    primaryActionLabel: '更新主档',
    secondaryLabel: '主档信息'
  },
  resumes: {
    eyebrow: 'Resume Hub',
    accent: 'brand',
    primaryActionLabel: '继续编辑',
    secondaryLabel: '版本与正文'
  },
  jobs: {
    eyebrow: 'Job Library',
    accent: 'brand',
    primaryActionLabel: '浏览岗位',
    secondaryLabel: '岗位数据库'
  },
  mock: {
    eyebrow: 'Interview Practice',
    accent: 'success',
    primaryActionLabel: '开始训练',
    secondaryLabel: '逐题模拟'
  },
  applications: {
    eyebrow: 'Application Pipeline',
    accent: 'warn',
    primaryActionLabel: '继续推进',
    secondaryLabel: '投递流程'
  },
  interviews: {
    eyebrow: 'Interview Notes',
    accent: 'neutral',
    primaryActionLabel: '记录复盘',
    secondaryLabel: '真实面试'
  },
  settings: {
    eyebrow: 'Settings',
    accent: 'neutral',
    primaryActionLabel: '保存设置',
    secondaryLabel: '系统配置'
  }
};

const viewMeta: Record<WorkspaceView, WorkspaceViewMeta> = {
  home: {
    title: '工作台',
    description: '在一个更安静的主工作区里继续推进简历、岗位和投递。'
  },
  profile: {
    title: '个人档案',
    description: '维护你的主档信息，让后续简历生成、优化和模拟面试都基于同一份材料。'
  },
  resumes: {
    title: '简历中心',
    description: '围绕投递目标整理版本、正文和导入结果，把简历编辑集中在一个工作台里。'
  },
  jobs: {
    title: '岗位库',
    description: '把 JD 当成数据库来维护，并直接从岗位发起优化、投递和模拟面试。'
  },
  mock: {
    title: '模拟面试',
    description: '把设置、当前题目和回顾拆开，让注意力始终回到当前回答。'
  },
  applications: {
    title: '投递看板',
    description: '用更安静的结果面板推进每一次投递，把提醒和下一步动作收进同一条流程。'
  },
  interviews: {
    title: '面试记录',
    description: '沉淀真实面试记录、状态和复盘，形成可以反复回看的面试档案。'
  },
  settings: {
    title: '设置',
    description: '在独立设置页里管理模型、密钥和工作区基础配置。'
  }
};

const navigation: WorkspaceNavigationItem[] = [
  { id: 'home', label: '首页', hint: 'Home', icon: 'home' },
  { id: 'profile', label: '个人档案', hint: 'Profile', icon: 'profile' },
  { id: 'resumes', label: '简历中心', hint: 'Resumes', icon: 'resume' },
  { id: 'jobs', label: 'JD 库', hint: 'Jobs', icon: 'job' },
  { id: 'mock', label: '模拟面试', hint: 'Mock', icon: 'mock' },
  { id: 'applications', label: '投递看板', hint: 'Pipeline', icon: 'application' },
  { id: 'interviews', label: '面试记录', hint: 'Notes', icon: 'interview' },
  { id: 'settings', label: '设置', hint: 'Settings', icon: 'settings' }
];

export function getWorkspaceViewChrome(view: WorkspaceView) {
  return viewChrome[view];
}

export function getWorkspaceViewMeta(view: WorkspaceView) {
  return viewMeta[view];
}

export function getWorkspaceNavigation() {
  return navigation;
}

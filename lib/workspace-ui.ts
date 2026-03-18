export type WorkspaceView =
  | 'home'
  | 'profile'
  | 'resumes'
  | 'jobs'
  | 'mock'
  | 'applications'
  | 'interviews'
  | 'settings';

type WorkspaceViewChrome = {
  eyebrow: string;
  accent: 'indigo' | 'blue' | 'emerald' | 'amber' | 'slate';
  primaryActionLabel: string;
  secondaryLabel: string;
};

const viewChrome: Record<WorkspaceView, WorkspaceViewChrome> = {
  home: {
    eyebrow: 'Action Home',
    accent: 'indigo',
    primaryActionLabel: '继续推进',
    secondaryLabel: '今日任务'
  },
  profile: {
    eyebrow: 'Profile Base',
    accent: 'slate',
    primaryActionLabel: '更新档案',
    secondaryLabel: '主档信息'
  },
  resumes: {
    eyebrow: 'Resume Studio',
    accent: 'indigo',
    primaryActionLabel: '生成简历',
    secondaryLabel: '版本编辑'
  },
  jobs: {
    eyebrow: 'Job Database',
    accent: 'blue',
    primaryActionLabel: '搜索岗位',
    secondaryLabel: '筛选与联动'
  },
  mock: {
    eyebrow: 'Interview Trainer',
    accent: 'emerald',
    primaryActionLabel: '开始模拟',
    secondaryLabel: '逐题训练'
  },
  applications: {
    eyebrow: 'Pipeline Board',
    accent: 'amber',
    primaryActionLabel: '查看投递',
    secondaryLabel: '推进状态'
  },
  interviews: {
    eyebrow: 'Interview Tracker',
    accent: 'slate',
    primaryActionLabel: '记录面试',
    secondaryLabel: '复盘沉淀'
  },
  settings: {
    eyebrow: 'Workspace Settings',
    accent: 'slate',
    primaryActionLabel: '保存设置',
    secondaryLabel: '系统配置'
  }
};

export function getWorkspaceViewChrome(view: WorkspaceView) {
  return viewChrome[view];
}

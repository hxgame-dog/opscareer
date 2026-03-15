import { ResumeTheme, ResumeThemeDefinition } from '@/types/domain';

export const resumeThemes: ResumeThemeDefinition[] = [
  {
    id: 'CLASSIC',
    name: 'Classic Ledger',
    tone: '稳重清晰，适合大多数中文岗位投递',
    accentColor: '#0f766e',
    fontFamily: 'Times',
    sectionLabel: '职业履历'
  },
  {
    id: 'EXECUTIVE',
    name: 'Executive Brief',
    tone: '更强调战略影响和业务结果，适合高级岗位',
    accentColor: '#9a3412',
    fontFamily: 'Helvetica',
    sectionLabel: '核心战绩'
  },
  {
    id: 'MODERN',
    name: 'Modern Signal',
    tone: '信息密度高，适合技术岗位和现代团队',
    accentColor: '#1d4ed8',
    fontFamily: 'Courier',
    sectionLabel: '项目与成果'
  }
];

export function getResumeTheme(theme?: ResumeTheme) {
  return resumeThemes.find((item) => item.id === theme) ?? resumeThemes[0];
}

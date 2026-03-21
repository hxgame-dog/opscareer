import type { ProfileInput } from '@/types/domain';

export const DEFAULT_PROFILE: ProfileInput = {
  basics: {
    name: '张三',
    email: 'zhangsan@example.com',
    phone: '13800000000',
    location: '上海',
    summary: '5 年后端与 SRE 经验，擅长高可用平台、自动化运维与成本优化。',
    yearsOfExperience: 5
  },
  experiences: [
    {
      company: '示例科技',
      role: 'SRE 工程师',
      start: '2021-03',
      end: '2025-03',
      achievements: ['搭建监控体系，故障平均恢复时间下降 40%', '推动 IaC，发布效率提升 2 倍'],
      techStack: ['Kubernetes', 'Terraform', 'Prometheus', 'Go']
    }
  ],
  projects: [
    {
      name: '多集群稳定性治理项目',
      role: '负责人',
      summary: '建设统一告警与容量预测机制',
      highlights: ['上线后 P1 故障数下降 35%', '资源利用率提升 18%']
    }
  ],
  skills: ['Kubernetes', 'Terraform', 'Go', 'Linux', 'AWS'],
  education: [
    {
      school: '某大学',
      degree: '本科',
      major: '计算机科学'
    }
  ],
  language: 'zh-CN'
};

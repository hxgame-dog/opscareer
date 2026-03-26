import type { JobPostingDetail, JobPostingInsight, ResumeDiagnosisReport } from '@/types/domain';

function normalizeKeywords(raw: string[]): string[] {
  return Array.from(new Set(raw.map((item) => item.trim()).filter(Boolean))).slice(0, 12);
}

function extractKeywords(description: string) {
  const candidates = [
    'kubernetes',
    'docker',
    'aws',
    'gcp',
    'azure',
    'linux',
    'terraform',
    'prometheus',
    'grafana',
    'python',
    'go',
    'java',
    'node',
    'react',
    'next.js',
    'typescript',
    'system design',
    '微服务',
    '云原生',
    '监控',
    '稳定性',
    '自动化',
    '架构',
    '英文',
    '沟通',
    'sql'
  ];
  const lower = description.toLowerCase();
  return candidates.filter((item) => lower.includes(item.toLowerCase()));
}

export function buildJobPostingInsight(input: {
  description: string;
  savedKeywords: string[];
  latestDiagnosis: ResumeDiagnosisReport | null;
  linkedStats: JobPostingDetail['linkedStats'];
}): JobPostingInsight {
  const description = input.description;
  const lower = description.toLowerCase();
  const keywords = normalizeKeywords([...input.savedKeywords, ...extractKeywords(description)]);
  const englishRequired = /english|英文|口语|written english|spoken english/i.test(description);
  const seniority = /leader|lead|staff|principal|架构|负责人/i.test(description)
    ? 'lead'
    : /senior|高级|资深/i.test(description)
      ? 'senior'
      : /junior|初级|应届|校招/i.test(description)
        ? 'entry'
        : /mid|3年|5年|中级/i.test(description)
          ? 'mid'
          : 'unknown';
  const urgency = input.linkedStats.applicationCount > 0 || input.linkedStats.mockInterviewCount > 0 ? 'high' : input.linkedStats.diagnosisCount > 0 ? 'medium' : 'low';

  const risks = [
    englishRequired ? '岗位描述包含英文沟通/阅读要求。' : null,
    keywords.length < 4 ? 'JD 结构化关键词还不够丰富，建议补充更完整的岗位描述。' : null,
    /on-call|值班|7x24|轮班/i.test(description) ? '岗位可能包含值班/On-call 要求。' : null,
    input.latestDiagnosis && input.latestDiagnosis.riskFlags.length > 0 ? input.latestDiagnosis.riskFlags[0] : null
  ].filter(Boolean) as string[];

  const strengths = [
    keywords.length >= 6 ? '岗位要求较清晰，适合做关键词导向的简历优化。' : '这条 JD 可以先作为方向参考继续补充。',
    /平台|infra|infrastructure|系统|架构|云原生/i.test(description) ? '这是偏平台/系统型岗位，比较适合做项目深挖与系统设计准备。' : null,
    input.latestDiagnosis && input.latestDiagnosis.strengths.length > 0 ? input.latestDiagnosis.strengths[0] : null
  ].filter(Boolean) as string[];

  const nextActions = [
    input.latestDiagnosis ? '基于最新诊断结果继续打磨简历缺口。' : '先对这条 JD 跑一次简历优化，拿到匹配度诊断。',
    input.linkedStats.applicationCount > 0 ? '回到投递记录补齐下一步动作和截止时间。' : '如果判断匹配，可以直接创建一条投递记录。',
    input.linkedStats.mockInterviewCount > 0 ? '继续用这条 JD 做针对性模拟面试复盘。' : '在投递前先做一轮模拟面试，验证表述是否贴近岗位。'
  ];

  const diagnosisScore = input.latestDiagnosis?.score ?? null;
  const keywordScore = Math.min(100, keywords.length * 10);
  const score = diagnosisScore ? Math.round((diagnosisScore * 0.7) + (keywordScore * 0.3)) : keywordScore;

  const summary = input.latestDiagnosis
    ? `当前岗位洞察分 ${score}，已有诊断结果可复用，建议优先围绕关键词缺口和风险提示继续推进。`
    : `当前岗位洞察分 ${score}，建议先做一次简历优化和面试准备，把 JD 变成可执行动作。`;

  return {
    score,
    summary,
    keywords,
    strengths: strengths.slice(0, 3),
    risks: risks.slice(0, 4),
    nextActions,
    signals: {
      englishRequired,
      seniority,
      urgency
    }
  };
}

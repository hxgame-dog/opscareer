import {
  MockInterviewDimensionScores,
  MockInterviewEvaluation,
  MockInterviewQuestionCategory,
  MockInterviewSummary
} from '@/types/domain';

export const mockInterviewCategories: MockInterviewQuestionCategory[] = [
  'EXPERIENCE',
  'PROJECT',
  'TECHNICAL',
  'SCENARIO',
  'COMMUNICATION'
];

export const mockInterviewSessionStatuses = ['DRAFT', 'IN_PROGRESS', 'COMPLETED', 'ABANDONED'] as const;

export const emptyMockInterviewDimensions: MockInterviewDimensionScores = {
  relevance: 0,
  technicalDepth: 0,
  structure: 0,
  jobFit: 0,
  evidence: 0
};

export function getMockInterviewCategoryLabel(category: MockInterviewQuestionCategory) {
  switch (category) {
    case 'EXPERIENCE':
      return '基础经历';
    case 'PROJECT':
      return '项目深挖';
    case 'TECHNICAL':
      return '技术能力';
    case 'SCENARIO':
      return '场景题';
    case 'COMMUNICATION':
      return '沟通协作';
    default:
      return category;
  }
}

export function averageDimensionScores(
  evaluations: Array<Pick<MockInterviewEvaluation, 'dimensionScores'>>
): MockInterviewDimensionScores {
  if (evaluations.length === 0) {
    return { ...emptyMockInterviewDimensions };
  }

  const totals = evaluations.reduce(
    (acc, evaluation) => ({
      relevance: acc.relevance + evaluation.dimensionScores.relevance,
      technicalDepth: acc.technicalDepth + evaluation.dimensionScores.technicalDepth,
      structure: acc.structure + evaluation.dimensionScores.structure,
      jobFit: acc.jobFit + evaluation.dimensionScores.jobFit,
      evidence: acc.evidence + evaluation.dimensionScores.evidence
    }),
    { ...emptyMockInterviewDimensions }
  );

  return {
    relevance: Math.round(totals.relevance / evaluations.length),
    technicalDepth: Math.round(totals.technicalDepth / evaluations.length),
    structure: Math.round(totals.structure / evaluations.length),
    jobFit: Math.round(totals.jobFit / evaluations.length),
    evidence: Math.round(totals.evidence / evaluations.length)
  };
}

export function inferPerformanceLevel(score: number) {
  if (score >= 85) return 'Strong';
  if (score >= 70) return 'Promising';
  if (score >= 55) return 'Needs Work';
  return 'At Risk';
}

export function buildFallbackMockInterviewSummary(evaluations: MockInterviewEvaluation[]): MockInterviewSummary {
  const overallScore =
    evaluations.length === 0 ? 0 : Math.round(evaluations.reduce((sum, item) => sum + item.score, 0) / evaluations.length);
  const dimensionScores = averageDimensionScores(evaluations);

  return {
    overallScore,
    dimensionScores,
    performanceLevel: inferPerformanceLevel(overallScore),
    topStrengths: evaluations.flatMap((item) => item.strengths).slice(0, 3),
    topRisks: evaluations.flatMap((item) => item.gaps).slice(0, 3),
    recommendedTopics: evaluations.flatMap((item) => item.followUpAdvice).slice(0, 3)
  };
}

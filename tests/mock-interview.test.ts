import { describe, expect, test } from 'vitest';
import { averageDimensionScores, buildFallbackMockInterviewSummary } from '@/lib/mock-interview';

describe('mock interview helpers', () => {
  test('averageDimensionScores computes rounded averages', () => {
    expect(
      averageDimensionScores([
        {
          dimensionScores: {
            relevance: 80,
            technicalDepth: 70,
            structure: 90,
            jobFit: 85,
            evidence: 75
          }
        },
        {
          dimensionScores: {
            relevance: 60,
            technicalDepth: 90,
            structure: 70,
            jobFit: 75,
            evidence: 85
          }
        }
      ])
    ).toEqual({
      relevance: 70,
      technicalDepth: 80,
      structure: 80,
      jobFit: 80,
      evidence: 80
    });
  });

  test('buildFallbackMockInterviewSummary aggregates scores and suggestions', () => {
    const summary = buildFallbackMockInterviewSummary([
      {
        score: 80,
        dimensionScores: {
          relevance: 80,
          technicalDepth: 75,
          structure: 82,
          jobFit: 78,
          evidence: 70
        },
        strengths: ['结构清晰'],
        gaps: ['案例不够具体'],
        improvedAnswer: '...',
        followUpAdvice: '补充量化成果'
      },
      {
        score: 60,
        dimensionScores: {
          relevance: 65,
          technicalDepth: 58,
          structure: 62,
          jobFit: 66,
          evidence: 55
        },
        strengths: ['问题理解较快'],
        gaps: ['技术深度不足'],
        improvedAnswer: '...',
        followUpAdvice: '补强系统设计思路'
      }
    ]);

    expect(summary.overallScore).toBe(70);
    expect(summary.dimensionScores.technicalDepth).toBe(67);
    expect(summary.performanceLevel).toBe('Promising');
    expect(summary.topStrengths).toContain('结构清晰');
    expect(summary.recommendedTopics).toContain('补强系统设计思路');
  });
});

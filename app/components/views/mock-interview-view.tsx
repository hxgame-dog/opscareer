'use client';

import { useState } from 'react';
import { ActionBar } from '@/app/components/ui/action-bar';
import { EmptyState } from '@/app/components/ui/empty-state';
import { NextStepPanel } from '@/app/components/ui/next-step-panel';
import { PageHeader } from '@/app/components/ui/page-header';
import { PanelShell } from '@/app/components/ui/panel-shell';
import { ResultCard } from '@/app/components/ui/result-card';
import { ToolbarTabs } from '@/app/components/ui/toolbar-tabs';
import { getMockInterviewCategoryLabel } from '@/lib/mock-interview';
import { getMockInterviewNextRecommendation } from '@/lib/product-guidance';
import type { Language, MockInterviewEvaluation, MockInterviewListItem, MockInterviewQuestion, MockInterviewSession } from '@/types/domain';

type JobPostingRecord = {
  id: string;
  company: string;
  role: string;
};

type MockInterviewViewProps = {
  jdLibrary: JobPostingRecord[];
  mockInterviewSetup: {
    jobPostingId: string;
    targetLevel: string;
    language: Language;
    questionCount: 3 | 5 | 8;
  };
  mockInterviewSessions: MockInterviewListItem[];
  selectedMockInterview: MockInterviewSession | null;
  currentMockQuestion: MockInterviewQuestion | null;
  pendingMockEvaluationTurn:
    | {
        questionId: string;
        transcript: string;
        evaluation: MockInterviewEvaluation | null;
      }
    | null;
  isRecordingMockInterview: boolean;
  isSubmittingMockTurn: boolean;
  onMockInterviewSetupChange: (payload: {
    jobPostingId: string;
    targetLevel: string;
    language: Language;
    questionCount: 3 | 5 | 8;
  }) => void;
  onStartMockInterview: () => void;
  onLoadMockInterviews: () => void;
  onToggleMockInterviewRecording: () => void;
  onSubmitMockInterviewAnswer: (questionId: string, retryEvaluation?: boolean) => void;
  onSaveMockInterviewToTracker: () => void;
  onOpenMockInterview: (id: string) => void;
  isStartingMockInterview: boolean;
};

export function MockInterviewView({
  jdLibrary,
  mockInterviewSetup,
  mockInterviewSessions,
  selectedMockInterview,
  currentMockQuestion,
  pendingMockEvaluationTurn,
  isRecordingMockInterview,
  isSubmittingMockTurn,
  onMockInterviewSetupChange,
  onStartMockInterview,
  onLoadMockInterviews,
  onToggleMockInterviewRecording,
  onSubmitMockInterviewAnswer,
  onSaveMockInterviewToTracker,
  onOpenMockInterview,
  isStartingMockInterview
}: MockInterviewViewProps) {
  const [reviewTab, setReviewTab] = useState<'summary' | 'history'>('summary');
  const nextRecommendation = getMockInterviewNextRecommendation({
    hasSelectedSession: Boolean(selectedMockInterview),
    status: selectedMockInterview?.status,
    hasCurrentQuestion: Boolean(currentMockQuestion),
    hasSummary: Boolean(selectedMockInterview?.summary),
    answeredCount: selectedMockInterview?.turns.length,
    questionCount: selectedMockInterview?.questionCount
  });

  return (
    <section className="content-stack workspace-stage">
      <PageHeader
        eyebrow="Interview Practice"
        title="围绕目标岗位做一场专注训练"
        description="把设置、当前题目和会话回顾拆开，让你的注意力始终留在当前回答。"
        accent="success"
        meta={
          <>
            <span className="timeline-tag">逐题训练</span>
            <span className="timeline-tag">录音转写</span>
          </>
        }
        actions={
          <ActionBar
            left={
              <div className="mock-setup-compact">
                <select
                  value={mockInterviewSetup.jobPostingId}
                  onChange={(e) => onMockInterviewSetupChange({ ...mockInterviewSetup, jobPostingId: e.target.value })}
                >
                  <option value="">使用当前 JD 编辑区</option>
                  {jdLibrary.map((posting) => (
                    <option key={posting.id} value={posting.id}>
                      {posting.company} · {posting.role}
                    </option>
                  ))}
                </select>
                <select
                  value={mockInterviewSetup.language}
                  onChange={(e) => onMockInterviewSetupChange({ ...mockInterviewSetup, language: e.target.value as Language })}
                >
                  <option value="zh-CN">中文</option>
                  <option value="en-US">English</option>
                </select>
                <select
                  value={mockInterviewSetup.questionCount}
                  onChange={(e) => onMockInterviewSetupChange({ ...mockInterviewSetup, questionCount: Number(e.target.value) as 3 | 5 | 8 })}
                >
                  <option value={3}>3 题</option>
                  <option value={5}>5 题</option>
                  <option value={8}>8 题</option>
                </select>
              </div>
            }
            right={
              <div className="inline compact-actions">
                <button onClick={onStartMockInterview} disabled={isStartingMockInterview}>
                  {isStartingMockInterview ? '创建中...' : '开始模拟'}
                </button>
                <button className="secondary" onClick={onLoadMockInterviews}>刷新历史</button>
              </div>
            }
          />
        }
      />

      <NextStepPanel
        title={nextRecommendation.title}
        description={nextRecommendation.description}
        tags={
          selectedMockInterview
            ? [
                `${selectedMockInterview.company} · ${selectedMockInterview.role}`,
                `${selectedMockInterview.status}`,
                `已答 ${selectedMockInterview.turns.length}/${selectedMockInterview.questionCount} 题`
              ]
            : ['先选岗位', '可录音转写', '逐题评分']
        }
        actions={
          <div className="inline compact-actions">
            {!selectedMockInterview ? (
              <button onClick={onStartMockInterview} disabled={isStartingMockInterview}>
                {isStartingMockInterview ? '创建中...' : '开始模拟'}
              </button>
            ) : currentMockQuestion ? (
              <>
                <button onClick={onToggleMockInterviewRecording} disabled={isSubmittingMockTurn}>
                  {isRecordingMockInterview ? '结束录音并提交' : '开始录音回答'}
                </button>
                {pendingMockEvaluationTurn?.questionId === currentMockQuestion.id ? (
                  <button
                    className="warn"
                    onClick={() => onSubmitMockInterviewAnswer(currentMockQuestion.id, true)}
                    disabled={isSubmittingMockTurn}
                  >
                    重试评分
                  </button>
                ) : null}
              </>
            ) : selectedMockInterview.summary ? (
              <button className="warn" onClick={onSaveMockInterviewToTracker}>
                保存到 Interview Tracker
              </button>
            ) : (
              <button className="secondary" onClick={onLoadMockInterviews}>
                刷新历史
              </button>
            )}
          </div>
        }
      />

      <div className="mock-stage-layout">
        <PanelShell eyebrow="Runner" title="当前题目主卡" subtitle="把注意力集中在当前这道题和回答反馈。">
          {selectedMockInterview ? (
            <>
              <div className="mock-session-banner">
                <strong>{selectedMockInterview.company} · {selectedMockInterview.role}</strong>
                <span className="small">{selectedMockInterview.status} · 已答 {selectedMockInterview.turns.length}/{selectedMockInterview.questionCount} 题</span>
              </div>
              {currentMockQuestion ? (
                <div className="mock-main-card">
                  <div className="mock-main-card-head">
                    <span className="timeline-tag">{getMockInterviewCategoryLabel(currentMockQuestion.category)}</span>
                    <span className="small">第 {currentMockQuestion.order} 题 · 难度 {currentMockQuestion.difficulty}</span>
                  </div>
                  <h3>{currentMockQuestion.question}</h3>
                  <p className="small">考察意图: {currentMockQuestion.intent}</p>
                  <div className="inline compact-actions">
                    <button onClick={onToggleMockInterviewRecording} disabled={isSubmittingMockTurn}>
                      {isRecordingMockInterview ? '结束录音并提交' : '开始录音回答'}
                    </button>
                    {pendingMockEvaluationTurn?.questionId === currentMockQuestion.id ? (
                      <button
                        className="warn"
                        onClick={() => onSubmitMockInterviewAnswer(currentMockQuestion.id, true)}
                        disabled={isSubmittingMockTurn}
                      >
                        重试评分
                      </button>
                    ) : null}
                  </div>
                </div>
              ) : (
                <EmptyState
                title="当前会话没有待回答题目"
                description="你可以查看总评，或者重新开始一场新的模拟面试。"
                actionLabel="重新开始模拟"
                onAction={onStartMockInterview}
              />
              )}
              <PanelShell eyebrow="Progress" title="题目进度" subtitle="每道题的作答状态和得分。">
                <div className="dashboard-card-list">
                  {selectedMockInterview.questions.map((question) => {
                    const turn = selectedMockInterview.turns.find((item) => item.questionId === question.id);
                    return (
                      <ResultCard
                        key={question.id}
                        title={`第 ${question.order} 题 · ${getMockInterviewCategoryLabel(question.category)}`}
                        subtitle={question.question}
                        meta={<div className="small">{turn?.evaluation ? `得分 ${turn.evaluation.score}` : turn ? '已转写待评分' : '未作答'}</div>}
                      />
                    );
                  })}
                </div>
              </PanelShell>
            </>
          ) : (
            <EmptyState
              title="还没有选中模拟面试"
              description="第一次使用时，可以直接选择一个岗位开始模拟；开始后这里会变成逐题训练区。"
              actionLabel="开始第一场模拟"
              onAction={onStartMockInterview}
            />
          )}
        </PanelShell>

        <PanelShell eyebrow="Review" title="会话回顾" subtitle="历史和总评分开，默认总评优先。">
          <ToolbarTabs
            value={reviewTab}
            items={[
              { id: 'summary', label: '总评' },
              { id: 'history', label: '历史' }
            ]}
            onChange={setReviewTab}
          />
          {reviewTab === 'summary' ? (
            selectedMockInterview?.summary ? (
              <div className="tool-tab-panel">
                <div className="mock-score-grid">
                  <ResultCard title="总分" subtitle={String(selectedMockInterview.summary.overallScore)} />
                  <ResultCard title="表现等级" subtitle={selectedMockInterview.summary.performanceLevel} />
                </div>
                <ResultCard
                  title="亮点"
                  meta={<div className="small">{selectedMockInterview.summary.topStrengths.join('；') || '无'}</div>}
                />
                <ResultCard
                  title="风险点"
                  meta={<div className="small">{selectedMockInterview.summary.topRisks.join('；') || '无'}</div>}
                />
                <button className="warn" onClick={onSaveMockInterviewToTracker}>
                  保存到 Interview Tracker
                </button>
              </div>
            ) : (
              <EmptyState title="还没有整场总评" description="完成全部题目后，这里会展示总分、亮点和风险点。" />
            )
          ) : (
            <div className="dashboard-card-list">
              {mockInterviewSessions.length > 0 ? (
                mockInterviewSessions.map((session) => (
                  <ResultCard
                    key={session.id}
                    title={`${session.company} · ${session.role}`}
                    subtitle={`${session.status} · ${session.answeredCount}/${session.questionCount} 题`}
                    meta={<div className="small">{session.overallScore !== null ? `总分 ${session.overallScore}` : '尚未完成'}</div>}
                    onClick={() => onOpenMockInterview(session.id)}
                  />
                ))
              ) : (
                <EmptyState title="暂无模拟面试记录" description="开始第一场模拟面试后，历史会沉淀在这里。" />
              )}
            </div>
          )}
        </PanelShell>
      </div>
    </section>
  );
}

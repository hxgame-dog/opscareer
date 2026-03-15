import { EmptyState } from '@/app/components/ui/empty-state';
import { SectionHeader } from '@/app/components/ui/section-header';
import { getMockInterviewCategoryLabel } from '@/lib/mock-interview';
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
  return (
    <section className="content-stack">
      <article className="panel">
        <SectionHeader
          eyebrow="Mock Interview"
          title="开始一场模拟面试"
          actions={
            <div className="inline">
            <button onClick={onStartMockInterview} disabled={isStartingMockInterview}>
              {isStartingMockInterview ? '创建中...' : '开始模拟'}
            </button>
            <button className="secondary" onClick={onLoadMockInterviews}>
              刷新历史
            </button>
            </div>
          }
        />
        <div className="grid-4">
          <div>
            <label>选择已有 JD</label>
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
          </div>
          <div>
            <label>语言</label>
            <select
              value={mockInterviewSetup.language}
              onChange={(e) => onMockInterviewSetupChange({ ...mockInterviewSetup, language: e.target.value as Language })}
            >
              <option value="zh-CN">中文</option>
              <option value="en-US">English</option>
            </select>
          </div>
          <div>
            <label>目标级别</label>
            <input
              value={mockInterviewSetup.targetLevel}
              onChange={(e) => onMockInterviewSetupChange({ ...mockInterviewSetup, targetLevel: e.target.value })}
            />
          </div>
          <div>
            <label>题目数量</label>
            <select
              value={mockInterviewSetup.questionCount}
              onChange={(e) =>
                onMockInterviewSetupChange({
                  ...mockInterviewSetup,
                  questionCount: Number(e.target.value) as 3 | 5 | 8
                })
              }
            >
              <option value={3}>3 题</option>
              <option value={5}>5 题</option>
              <option value={8}>8 题</option>
            </select>
          </div>
        </div>
      </article>

      <div className="mock-view-layout">
        <article className="panel mock-runner-panel">
          <SectionHeader eyebrow="Runner" title="当前答题区" />
          {selectedMockInterview ? (
            <>
              <div className="small">
                {selectedMockInterview.company} · {selectedMockInterview.role} · {selectedMockInterview.status}
              </div>
              {currentMockQuestion ? (
                <div className="item mock-question-card">
                  <div className="timeline-tag">{getMockInterviewCategoryLabel(currentMockQuestion.category)}</div>
                  <div className="small">
                    第 {currentMockQuestion.order} 题 · 难度 {currentMockQuestion.difficulty}
                  </div>
                  <p>{currentMockQuestion.question}</p>
                  <div className="small">考察意图: {currentMockQuestion.intent}</div>
                  <div className="inline">
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
                <EmptyState title="当前会话已没有待回答题目" description="可以查看总评，或者重新开始一场新的模拟面试。" />
              )}
              <div className="list" style={{ marginTop: 12 }}>
                {selectedMockInterview.questions.map((question) => {
                  const turn = selectedMockInterview.turns.find((item) => item.questionId === question.id);
                  return (
                    <div key={question.id} className="item">
                      <strong>
                        第 {question.order} 题 · {getMockInterviewCategoryLabel(question.category)}
                      </strong>
                      <div className="small">{question.question}</div>
                      <div className="small">
                        {turn?.evaluation ? `得分 ${turn.evaluation.score}` : turn ? '已转写待评分' : '未作答'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <EmptyState title="还没有选中模拟面试" description="从右侧历史里打开一场会话后，就可以在这里逐题回答。" />
          )}
        </article>

        <article className="panel mock-review-panel">
          <SectionHeader eyebrow="Review" title="会话回顾" />
          {selectedMockInterview?.summary ? (
            <>
              <div className="mock-score-grid">
                <div className="item">
                  <strong>总分</strong>
                  <div className="mock-score">{selectedMockInterview.summary.overallScore}</div>
                </div>
                <div className="item">
                  <strong>表现等级</strong>
                  <div className="small">{selectedMockInterview.summary.performanceLevel}</div>
                </div>
                <div className="item">
                  <strong>优势</strong>
                  <div className="small">{selectedMockInterview.summary.topStrengths.join('；') || '无'}</div>
                </div>
                <div className="item">
                  <strong>风险点</strong>
                  <div className="small">{selectedMockInterview.summary.topRisks.join('；') || '无'}</div>
                </div>
              </div>
              <button className="warn" onClick={onSaveMockInterviewToTracker}>
                保存到 Interview Tracker
              </button>
            </>
          ) : (
            <EmptyState title="还没有整场总评" description="完成全部题目后，这里会展示总分、亮点和风险点。" />
          )}
          <div className="list" style={{ marginTop: 12 }}>
            {mockInterviewSessions.map((session) => (
              <button key={session.id} className="item card-button" onClick={() => onOpenMockInterview(session.id)}>
                <strong>
                  {session.company} · {session.role}
                </strong>
                <div className="small">
                  {session.status} · {session.answeredCount}/{session.questionCount} 题 ·{' '}
                  {session.overallScore !== null ? `总分 ${session.overallScore}` : '尚未完成'}
                </div>
              </button>
            ))}
            {mockInterviewSessions.length === 0 ? <EmptyState title="暂无模拟面试记录" description="开始第一场模拟面试后，历史会沉淀在这里。" /> : null}
          </div>
        </article>
      </div>
    </section>
  );
}

import React, { useState } from 'react';
import {
  Play,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Award,
  Sparkles,
  ChevronRight,
  ArrowRight,
  RotateCcw,
  BarChart3,
  Check,
  FileCode2,
  Clock,
  ShieldCheck,
  Lightbulb,
} from 'lucide-react';
import {
  InterviewSession,
  InterviewType,
  InterviewDifficulty,
  InterviewQuestion,
} from '../../types';

interface MockInterviewViewProps {
  sessions: InterviewSession[];
  activeSession: InterviewSession | null;
  onStartInterview: (type: InterviewType, difficulty: InterviewDifficulty, jobId?: string) => void;
  onSubmitAnswer: (sessionId: string, questionId: string, userResponse: string) => void;
  onFinishInterview: (sessionId: string) => void;
  onSelectSession: (sessionId: string) => void;
  isLoading: boolean;
}

export const MockInterviewView: React.FC<MockInterviewViewProps> = ({
  sessions,
  activeSession,
  onStartInterview,
  onSubmitAnswer,
  onFinishInterview,
  onSelectSession,
  isLoading,
}) => {
  const [selectedType, setSelectedType] = useState<InterviewType>('Technical');
  const [selectedDifficulty, setSelectedDifficulty] = useState<InterviewDifficulty>('Medium');
  const [userResponse, setUserResponse] = useState('');
  const [showKeyPoints, setShowKeyPoints] = useState(false);

  // Get current active question (the first unanswered question or the latest answered question)
  const currentQuestions = activeSession?.questions || [];
  const activeQuestionIndex = currentQuestions.findIndex((q) => !q.answer);
  const currentQuestion = activeQuestionIndex !== -1 ? currentQuestions[activeQuestionIndex] : currentQuestions[currentQuestions.length - 1];

  const handleAnswerSubmit = () => {
    if (!activeSession || !currentQuestion || !userResponse.trim()) return;
    onSubmitAnswer(activeSession.id, currentQuestion.id, userResponse);
    setUserResponse('');
    setShowKeyPoints(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Card */}
      {!activeSession || activeSession.status === 'COMPLETED' ? (
        <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-6 shadow-2xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs uppercase tracking-wider mb-1">
                <Sparkles className="w-4 h-4" />
                <span>Interactive AI Mock Interview Engine</span>
              </div>
              <h2 className="text-xl font-bold text-slate-100">Practice Technical & Behavioral Interviews</h2>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                Simulate real interview questions grounded in your verified GitHub projects (NexusFlow), LeetCode history, and target role requirements. Receive instant 0-100 evaluations and adaptive follow-up questions.
              </p>
            </div>

            <button
              onClick={() => onStartInterview(selectedType, selectedDifficulty)}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 shrink-0"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Start Mock Interview</span>
            </button>
          </div>

          {/* Setup Selectors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-800/80">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">Interview Type</label>
              <div className="grid grid-cols-3 gap-2">
                {(['Technical', 'DSA', 'Project', 'Behavioral', 'System Design', 'Mixed'] as InterviewType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setSelectedType(t)}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                      selectedType === t
                        ? 'border-indigo-500 bg-indigo-600/20 text-indigo-300 shadow-sm'
                        : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">Difficulty Level</label>
              <div className="grid grid-cols-3 gap-2">
                {(['Easy', 'Medium', 'Hard'] as InterviewDifficulty[]).map((d) => (
                  <button
                    key={d}
                    onClick={() => setSelectedDifficulty(d)}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                      selectedDifficulty === d
                        ? 'border-blue-500 bg-blue-600/20 text-blue-300 shadow-sm'
                        : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Active Mock Interview Simulator */}
      {activeSession && activeSession.status === 'IN_PROGRESS' && (
        <div className="rounded-2xl border border-indigo-500/30 bg-slate-900/90 p-6 shadow-2xl space-y-6">
          {/* Header Bar */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-xs font-mono font-semibold">
                {activeSession.interviewType} — {activeSession.difficulty}
              </span>
              <span className="text-xs text-slate-400">
                Question {currentQuestion ? currentQuestion.questionIndex + 1 : 1} of 5
              </span>
            </div>

            <button
              onClick={() => onFinishInterview(activeSession.id)}
              className="px-4 py-1.5 rounded-lg border border-rose-500/40 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 text-xs font-semibold transition-all"
            >
              Finish Interview
            </button>
          </div>

          {/* Current Question Card */}
          {currentQuestion && (
            <div className="space-y-6">
              <div className="p-5 rounded-xl border border-slate-800 bg-slate-950/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest font-mono">
                    {currentQuestion.category}
                  </span>
                  <button
                    onClick={() => setShowKeyPoints(!showKeyPoints)}
                    className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-indigo-300 transition-colors"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{showKeyPoints ? 'Hide Concepts' : 'Show Concept Hints'}</span>
                  </button>
                </div>

                <h3 className="text-base font-bold text-slate-100 leading-snug">
                  {currentQuestion.questionText}
                </h3>

                {showKeyPoints && currentQuestion.expectedKeyPoints && (
                  <div className="p-3 rounded-lg bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-200 space-y-1">
                    <span className="font-semibold text-indigo-400">Expected Key Concepts:</span>
                    <ul className="list-disc pl-4 space-y-0.5">
                      {(currentQuestion.expectedKeyPoints as string[]).map((pt, i) => (
                        <li key={i}>{pt}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Answer Input or Previous Answer Evaluation */}
              {!currentQuestion.answer ? (
                <div className="space-y-3">
                  <label className="block text-xs font-semibold text-slate-300">
                    Your Response
                  </label>
                  <textarea
                    value={userResponse}
                    onChange={(e) => setUserResponse(e.target.value)}
                    placeholder="Type your technical response clearly, explaining trade-offs, edge cases, and architectural choices..."
                    rows={6}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-xs text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-indigo-500/50 focus:outline-none resize-none"
                  />

                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-500">
                      {userResponse.trim().split(/\s+/).filter(Boolean).length} words
                    </span>
                    <button
                      onClick={handleAnswerSubmit}
                      disabled={isLoading || !userResponse.trim()}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold transition-all shadow-lg shadow-indigo-600/30"
                    >
                      <Check className="w-4 h-4" />
                      <span>Submit Answer for Evaluation</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Evaluated Feedback Card */
                <div className="rounded-xl border border-emerald-500/30 bg-slate-950/90 p-5 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      Answer Evaluated
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">Score:</span>
                      <span className="px-3 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-sm">
                        {currentQuestion.answer.score} / 100
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/20 text-emerald-300 space-y-1">
                      <span className="font-bold uppercase tracking-wider text-[10px]">Strengths</span>
                      <ul className="list-disc pl-4 space-y-1 text-slate-300">
                        {(currentQuestion.answer.strengths as string[]).map((s, idx) => (
                          <li key={idx}>{s}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-500/20 text-amber-300 space-y-1">
                      <span className="font-bold uppercase tracking-wider text-[10px]">Areas to Improve</span>
                      <ul className="list-disc pl-4 space-y-1 text-slate-300">
                        {(currentQuestion.answer.weaknesses as string[]).map((w, idx) => (
                          <li key={idx}>{w}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 text-xs space-y-1.5">
                    <span className="font-semibold text-indigo-400 flex items-center gap-1.5">
                      <Lightbulb className="w-3.5 h-3.5" /> Model Response Blueprint
                    </span>
                    <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {currentQuestion.answer.improvedAnswer}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Completed Session Summary Card */}
      {activeSession && activeSession.status === 'COMPLETED' && (
        <div className="rounded-2xl border border-emerald-500/40 bg-slate-900/90 p-6 shadow-2xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">Mock Interview Performance Summary</h3>
                <p className="text-xs text-slate-400">
                  Overall Score: {activeSession.overallScore || 82}/100 across 6 technical dimensions
                </p>
              </div>
            </div>
          </div>

          {/* Breakdown Grid */}
          {activeSession.scoreBreakdown && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {Object.entries(activeSession.scoreBreakdown as unknown as Record<string, number>).map(([key, val]) => (
                <div key={key} className="p-3 rounded-xl border border-slate-800 bg-slate-950/70 text-center space-y-1">
                  <span className="text-[10px] text-slate-400 capitalize block truncate">
                    {key.replace(/([A-Z])/g, ' $1')}
                  </span>
                  <span className="text-base font-bold text-emerald-400">{val}%</span>
                </div>
              ))}
            </div>
          )}

          {/* Final Feedback */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 leading-relaxed">
            <span className="font-bold text-indigo-400 block mb-1">Final Evaluation Summary</span>
            {activeSession.finalFeedback}
          </div>
        </div>
      )}
    </div>
  );
};

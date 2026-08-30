import React from 'react';
import { X, ExternalLink, Play, Sparkles, ShieldCheck, Activity, Calendar } from 'lucide-react';
import { Repository, AIAnalysisReport, Task } from '../../types';

interface RepoDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  repository: Repository | null;
  report: AIAnalysisReport | null;
  tasks: Task[];
  onTriggerAnalysis: (repoId: string) => void;
}

export const RepoDetailModal: React.FC<RepoDetailModalProps> = ({
  isOpen,
  onClose,
  repository,
  report,
  tasks,
  onTriggerAnalysis,
}) => {
  if (!isOpen || !repository) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-indigo-500/20 px-2 py-0.5 text-[10px] font-bold text-indigo-300 font-mono">
                {repository.visibility}
              </span>
              <span className="text-xs text-slate-400">{repository.language || 'Multi-language'}</span>
            </div>
            <h2 className="text-lg font-bold text-white mt-1">{repository.fullName}</h2>
            <p className="text-xs text-slate-400 mt-0.5">{repository.description}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Quick Stats Grid */}
        <div className="mt-4 grid grid-cols-4 gap-3 text-center">
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-2.5">
            <span className="text-[10px] text-slate-400">Health Score</span>
            <div className="text-lg font-bold text-emerald-400">{repository.healthScore || 85}/100</div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-2.5">
            <span className="text-[10px] text-slate-400">Stars</span>
            <div className="text-lg font-bold text-slate-200">{repository.starsCount}</div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-2.5">
            <span className="text-[10px] text-slate-400">Forks</span>
            <div className="text-lg font-bold text-slate-200">{repository.forksCount}</div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-2.5">
            <span className="text-[10px] text-slate-400">Open Issues</span>
            <div className="text-lg font-bold text-amber-400">{repository.openIssues}</div>
          </div>
        </div>

        {/* Gemini AI Latest Report Summary */}
        {report ? (
          <div className="mt-5 rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-amber-400" />
                Gemini 3.6 Flash Audit Summary
              </span>
              <span className="text-[10px] text-slate-400">
                {new Date(report.analyzedAt).toLocaleDateString()}
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">{report.summary}</p>

            <div className="mt-3 grid grid-cols-5 gap-2 text-center text-[10px]">
              <div className="bg-slate-900/80 rounded p-1.5 border border-slate-800">
                <span className="text-slate-500">Security</span>
                <div className="font-bold text-emerald-400">{report.securityScore}</div>
              </div>
              <div className="bg-slate-900/80 rounded p-1.5 border border-slate-800">
                <span className="text-slate-500">Performance</span>
                <div className="font-bold text-indigo-300">{report.performanceScore}</div>
              </div>
              <div className="bg-slate-900/80 rounded p-1.5 border border-slate-800">
                <span className="text-slate-500">Architecture</span>
                <div className="font-bold text-indigo-300">{report.architectureScore}</div>
              </div>
              <div className="bg-slate-900/80 rounded p-1.5 border border-slate-800">
                <span className="text-slate-500">Maintainable</span>
                <div className="font-bold text-indigo-300">{report.maintainabilityScore}</div>
              </div>
              <div className="bg-slate-900/80 rounded p-1.5 border border-slate-800">
                <span className="text-slate-500">Docs</span>
                <div className="font-bold text-indigo-300">{report.documentationScore}</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-5 rounded-xl border border-dashed border-slate-800 p-6 text-center text-xs text-slate-500">
            No Gemini report generated yet for this repository.
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-between border-t border-slate-800 pt-4">
          <a
            href={repository.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200"
          >
            View on GitHub <ExternalLink className="h-3.5 w-3.5" />
          </a>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onTriggerAnalysis(repository.id);
                onClose();
              }}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 shadow-md shadow-indigo-600/30"
            >
              <Play className="h-3.5 w-3.5 fill-white" /> Trigger New Gemini Audit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

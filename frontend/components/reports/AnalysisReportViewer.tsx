import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Sparkles,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Code2,
  Search,
  Filter,
  Play
} from 'lucide-react';
import { AIAnalysisReport, SeverityLevel, Repository } from '../../types';

interface AnalysisReportViewerProps {
  reports: AIAnalysisReport[];
  repositories: Repository[];
  onTriggerAnalysis: (repoId: string) => void;
}

export const AnalysisReportViewer: React.FC<AnalysisReportViewerProps> = ({
  reports,
  repositories,
  onTriggerAnalysis,
}) => {
  const [selectedReportId, setSelectedReportId] = useState(reports[0]?.id || '');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');

  const selectedReport = reports.find((r) => r.id === selectedReportId) || reports[0];
  const targetRepo = repositories.find((r) => r.id === selectedReport?.repositoryId);

  const getSeverityBadge = (s: SeverityLevel) => {
    switch (s) {
      case 'CRITICAL':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'HIGH':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'MEDIUM':
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40';
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-500/40';
    }
  };

  const filteredFindings = selectedReport?.findings.filter((f) => {
    if (severityFilter === 'ALL') return true;
    return f.severity === severityFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-indigo-400" />
            AI Developer Intelligence Reports
          </h2>
          <p className="text-xs text-slate-400">
            Multi-dimensional static code analysis and architectural reviews powered by Gemini 3.6 Flash
          </p>
        </div>

        {/* Report Selector Dropdown */}
        <div className="flex items-center gap-2">
          <select
            value={selectedReportId}
            onChange={(e) => setSelectedReportId(e.target.value)}
            className="rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none"
          >
            {reports.map((rep) => {
              const repo = repositories.find((r) => r.id === rep.repositoryId);
              return (
                <option key={rep.id} value={rep.id}>
                  {repo?.fullName || 'Repo'} — Score: {rep.overallScore} ({new Date(rep.analyzedAt).toLocaleDateString()})
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {selectedReport && (
        <div className="space-y-6">
          {/* Executive Overview Header Card */}
          <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-slate-900 via-indigo-950/30 to-slate-900 p-6 shadow-xl">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
              <div>
                <span className="rounded-md bg-indigo-500/20 px-2 py-0.5 text-[10px] font-bold text-indigo-300 font-mono">
                  {selectedReport.modelName} v{selectedReport.modelVersion}
                </span>
                <h3 className="text-xl font-bold text-white mt-1">
                  {targetRepo?.fullName || 'Repository Audit Report'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Analyzed at {new Date(selectedReport.analyzedAt).toLocaleString()}
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-xs text-slate-400">Overall Health</div>
                  <div className="text-3xl font-extrabold text-emerald-400">
                    {selectedReport.overallScore}<span className="text-xs text-slate-500">/100</span>
                  </div>
                </div>

                <button
                  onClick={() => targetRepo && onTriggerAnalysis(targetRepo.id)}
                  className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition"
                >
                  <Play className="h-3.5 w-3.5 fill-white" /> Re-audit Repository
                </button>
              </div>
            </div>

            {/* Score Gauges */}
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                <span className="text-[10px] font-semibold text-slate-400">Security</span>
                <div className="text-lg font-bold text-emerald-400">{selectedReport.securityScore}</div>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                <span className="text-[10px] font-semibold text-slate-400">Performance</span>
                <div className="text-lg font-bold text-indigo-300">{selectedReport.performanceScore}</div>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                <span className="text-[10px] font-semibold text-slate-400">Architecture</span>
                <div className="text-lg font-bold text-indigo-300">{selectedReport.architectureScore}</div>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                <span className="text-[10px] font-semibold text-slate-400">Maintainability</span>
                <div className="text-lg font-bold text-indigo-300">{selectedReport.maintainabilityScore}</div>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                <span className="text-[10px] font-semibold text-slate-400">Documentation</span>
                <div className="text-lg font-bold text-indigo-300">{selectedReport.documentationScore}</div>
              </div>
            </div>

            {/* Gemini Executive Summary */}
            <div className="mt-5 space-y-2">
              <h4 className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-amber-400" /> Executive Architectural Summary
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                {selectedReport.summary}
              </p>
            </div>

            {/* Recommendations */}
            {selectedReport.recommendations && selectedReport.recommendations.length > 0 && (
              <div className="mt-4 space-y-2">
                <h4 className="text-xs font-bold text-slate-300">Actionable Architectural Recommendations</h4>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {selectedReport.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/80">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Actionable Findings Section */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Code2 className="h-4 w-4 text-indigo-400" />
                Detected Code Findings ({selectedReport.findings.length})
              </h3>

              {/* Filter */}
              <div className="flex items-center gap-2">
                <Filter className="h-3.5 w-3.5 text-slate-500" />
                <div className="flex gap-1 text-[11px]">
                  {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((s) => (
                    <button
                      key={s}
                      onClick={() => setSeverityFilter(s)}
                      className={`rounded-lg px-2.5 py-1 font-semibold transition ${
                        severityFilter === s
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {filteredFindings?.map((finding) => (
                <div
                  key={finding.id}
                  className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-3 transition hover:border-slate-700"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${getSeverityBadge(finding.severity)}`}>
                        {finding.severity}
                      </span>
                      <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-300">
                        {finding.category}
                      </span>
                      <h4 className="text-sm font-bold text-slate-100">{finding.title}</h4>
                    </div>

                    {finding.filePath && (
                      <span className="text-[11px] font-mono text-indigo-300 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                        {finding.filePath}:{finding.lineNumber || 1}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">{finding.description}</p>

                  {finding.snippet && (
                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 font-mono text-[11px] text-slate-300">
                      <pre className="overflow-x-auto">{finding.snippet}</pre>
                    </div>
                  )}

                  {finding.recommendation && (
                    <div className="rounded-xl border border-indigo-500/20 bg-indigo-950/20 p-3 text-xs text-indigo-200">
                      <strong className="text-indigo-400">Recommendation: </strong>
                      {finding.recommendation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

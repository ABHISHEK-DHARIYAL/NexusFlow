import React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Bot, CheckCircle2, AlertCircle, ArrowUpRight, ShieldCheck } from 'lucide-react';
import { AiExecutiveSummary } from '../../../backend/services/UnifiedCareerDashboardService';

interface AiExecutiveSummaryCardProps {
  summary?: AiExecutiveSummary;
}

export const AiExecutiveSummaryCard: React.FC<AiExecutiveSummaryCardProps> = ({ summary }) => {
  if (!summary) return null;

  return (
    <Card className="bg-slate-900 border-slate-800 p-6 space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100">AI Career Executive Summary</h2>
            <p className="text-xs text-slate-400">Deterministic Gemini synthesis grounded in verified platform data</p>
          </div>
        </div>
        <Badge variant="blue" className="text-xs">Grounded Synthesis</Badge>
      </div>

      <div className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 font-normal">
        {summary.summary}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strengths & Gaps */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Key Strengths
          </h3>
          <ul className="space-y-2 text-xs">
            {summary.strengths.map((str, idx) => (
              <li key={idx} className="flex items-start gap-2 text-slate-200 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/60">
                <span className="text-emerald-400 font-bold shrink-0">✓</span>
                <span>{str}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-amber-400" /> Recommended Actions
          </h3>
          <ul className="space-y-2 text-xs">
            {summary.recommendations.map((rec, idx) => (
              <li key={idx} className="flex items-start gap-2 text-slate-200 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/60">
                <ArrowUpRight className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Sources Tags */}
      <div className="pt-4 border-t border-slate-800/60 flex items-center gap-2 text-xs text-slate-400">
        <span className="font-semibold text-slate-500">Sources Analyzed:</span>
        <div className="flex flex-wrap gap-1.5">
          {summary.sourcesUsed.map((src, idx) => (
            <span key={idx} className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-mono">
              {src}
            </span>
          ))}
        </div>
      </div>
    </Card>
  );
};

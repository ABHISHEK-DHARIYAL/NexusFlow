import React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { useNavigate } from 'react-router-dom';
import { CheckSquare, AlertTriangle, ArrowRight, ShieldCheck } from 'lucide-react';

interface TopStrengthsGapsProps {
  strengths: Array<{ strength: string; evidence: string[] }>;
  gaps: Array<{
    gap: string;
    rank: number;
    whyItMatters: string;
    evidence: string;
    recommendedAction: string;
    sourceModule: string;
  }>;
}

export const TopStrengthsGaps: React.FC<TopStrengthsGapsProps> = ({ strengths, gaps }) => {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Top Strengths */}
      <Card className="bg-slate-900 border-slate-800 p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-slate-100">Top Verified Strengths</h2>
          </div>
          <Badge variant="emerald" className="text-xs">{strengths.length} Core Areas</Badge>
        </div>

        <div className="space-y-3">
          {strengths.map((item, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-2.5">
                <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-xs font-bold text-slate-100">{item.strength}</span>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {item.evidence.map((ev, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/50 text-emerald-300 border border-emerald-800/50 flex items-center gap-1"
                  >
                    ✓ {ev}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Top Gaps */}
      <Card className="bg-slate-900 border-slate-800 p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-slate-100">Priority Technical Gaps</h2>
          </div>
          <Badge variant="amber" className="text-xs">{gaps.length} Action Items</Badge>
        </div>

        <div className="space-y-3">
          {gaps.map((item) => (
            <div
              key={item.rank}
              className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 text-[11px] font-bold flex items-center justify-center shrink-0">
                    #{item.rank}
                  </span>
                  <span className="text-xs font-bold text-slate-100">{item.gap}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  {item.sourceModule}
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed pl-7">
                <strong className="text-slate-400">Why it matters:</strong> {item.whyItMatters}
              </p>
              <p className="text-[11px] text-slate-400 pl-7">
                <strong className="text-slate-500">Evidence:</strong> {item.evidence}
              </p>

              <div className="pl-7 pt-1 flex items-center justify-between">
                <span className="text-xs text-blue-400 font-medium">→ {item.recommendedAction}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs text-blue-400 hover:text-blue-300 p-0 h-auto cursor-pointer"
                  onClick={() => navigate('/jobs')}
                >
                  Bridge Gap <ArrowRight className="w-3.5 h-3.5 ml-1 inline" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

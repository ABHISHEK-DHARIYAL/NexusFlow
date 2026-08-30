import React, { useState } from 'react';
import { ShieldAlert, ChevronDown, ChevronUp, FileCode, CheckCircle, Lightbulb } from 'lucide-react';
import { Card } from '../ui/Card';
import { StatusBadge } from '../ui/StatusBadge';
import { Badge } from '../ui/Badge';
import { AIFinding } from '../../types';

export interface FindingCardProps {
  finding: AIFinding;
}

export const FindingCard: React.FC<FindingCardProps> = ({ finding }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="border-l-4 border-l-rose-500/80">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-semibold text-slate-100 text-sm">{finding.title}</h4>
              <StatusBadge status={finding.severity} type="severity" />
              <Badge variant="purple" size="sm">{finding.category}</Badge>
            </div>
            {finding.filePath && (
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                <FileCode className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span>{finding.filePath}</span>
                {finding.lineNumber && <span className="text-slate-500">:L{finding.lineNumber}</span>}
              </div>
            )}
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      <p className="text-xs text-slate-300 mt-3 leading-relaxed">{finding.description}</p>

      {isExpanded && (
        <div className="mt-4 space-y-3 pt-3 border-t border-slate-800">
          {finding.snippet && (
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-xs text-slate-200 overflow-x-auto">
              <pre>{finding.snippet}</pre>
            </div>
          )}

          {finding.recommendation && (
            <div className="flex items-start gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs text-emerald-300">
              <Lightbulb className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block mb-0.5">Recommendation:</span>
                {finding.recommendation}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

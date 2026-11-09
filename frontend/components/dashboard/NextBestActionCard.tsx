import React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, AlertOctagon, CheckCircle2, ShieldAlert, Sparkles } from 'lucide-react';
import { NextActionItem } from '../../../backend/services/CareerNextActionService';

interface NextBestActionCardProps {
  action: NextActionItem;
}

export const NextBestActionCard: React.FC<NextBestActionCardProps> = ({ action }) => {
  const navigate = useNavigate();

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return <Badge variant="rose" className="text-xs px-2.5 py-0.5 uppercase tracking-wide">CRITICAL</Badge>;
      case 'HIGH':
        return <Badge variant="amber" className="text-xs px-2.5 py-0.5 uppercase tracking-wide">HIGH PRIORITY</Badge>;
      case 'MEDIUM':
        return <Badge variant="blue" className="text-xs px-2.5 py-0.5 uppercase tracking-wide">MEDIUM PRIORITY</Badge>;
      default:
        return <Badge variant="slate" className="text-xs px-2.5 py-0.5 uppercase tracking-wide">RECOMMENDED</Badge>;
    }
  };

  return (
    <Card className="bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-slate-900 border-blue-500/30 p-5 shadow-lg relative overflow-hidden">
      <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs font-bold text-blue-400 tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5" /> Next Best Action
            </span>
            {getPriorityBadge(action.priority)}
            <span className="text-[10px] text-slate-400 font-mono bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">
              {action.source}
            </span>
          </div>

          <h2 className="text-base font-bold text-slate-100">{action.action}</h2>
          <p className="text-xs text-slate-300/90 max-w-3xl leading-relaxed">{action.reason}</p>
        </div>

        <Button
          onClick={() => navigate(action.link || '/dashboard')}
          rightIcon={<ArrowRight className="w-4 h-4" />}
          className="shrink-0 bg-blue-600 hover:bg-blue-500 text-white font-semibold cursor-pointer shadow-md"
        >
          Execute Action
        </Button>
      </div>
    </Card>
  );
};

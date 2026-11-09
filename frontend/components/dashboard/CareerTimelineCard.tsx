import React from 'react';
import { Card } from '../ui/Card';
import { History, Calendar, CheckCircle2, FileText, Code2, Briefcase } from 'lucide-react';

interface CareerTimelineCardProps {
  timeline: Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    timestamp: string;
  }>;
}

export const CareerTimelineCard: React.FC<CareerTimelineCardProps> = ({ timeline }) => {
  return (
    <Card className="bg-slate-900 border-slate-800 p-6 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-indigo-400" />
          <h2 className="text-base font-bold text-slate-100">Unified Career Timeline & Log</h2>
        </div>
        <span className="text-xs text-slate-400">Activity & Milestone Audit</span>
      </div>

      <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
        {timeline.map((event) => (
          <div key={event.id} className="relative space-y-1">
            <span className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-blue-500 border-2 border-slate-900" />
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-200">{event.title}</span>
              <span className="text-[10px] text-slate-500 font-mono">
                {new Date(event.timestamp).toLocaleDateString()}
              </span>
            </div>
            <p className="text-xs text-slate-400">{event.description}</p>
          </div>
        ))}
      </div>
    </Card>
  );
};

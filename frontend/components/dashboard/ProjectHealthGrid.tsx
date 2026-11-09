import React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { GitBranch, ShieldCheck, AlertCircle, ArrowUpRight } from 'lucide-react';

interface ProjectHealthGridProps {
  projects: Array<{
    id: string;
    name: string;
    description?: string;
    rank: number;
    evidence: string[];
    technicalAreas: string[];
    health: {
      github: string;
      resume: string;
      portfolio: string;
      verification: string;
      actionItem?: string;
    };
  }>;
}

export const ProjectHealthGrid: React.FC<ProjectHealthGridProps> = ({ projects }) => {
  return (
    <Card className="bg-slate-900 border-slate-800 p-6 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <GitBranch className="w-5 h-5 text-purple-400" />
          <h2 className="text-base font-bold text-slate-100">Project Portfolio & Evidence Health</h2>
        </div>
        <span className="text-xs text-slate-400">Ranked by Proof of Work</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {projects.map((project) => (
          <div
            key={project.id}
            className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-300 text-[11px] font-bold flex items-center justify-center shrink-0">
                  #{project.rank}
                </span>
                <span className="text-sm font-bold text-slate-100">{project.name}</span>
              </div>
              <Badge variant="emerald" className="text-[10px]">{project.health.verification}</Badge>
            </div>

            {project.description && (
              <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{project.description}</p>
            )}

            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {project.technicalAreas.map((tech, i) => (
                <span key={i} className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 text-[10px] font-mono border border-slate-800">
                  {tech}
                </span>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-800/60 grid grid-cols-3 gap-2 text-[11px] text-center">
              <div className="bg-slate-900/80 p-1.5 rounded border border-slate-800">
                <span className="text-slate-500 block text-[9px]">GITHUB</span>
                <span className="font-semibold text-slate-200">{project.health.github}</span>
              </div>
              <div className="bg-slate-900/80 p-1.5 rounded border border-slate-800">
                <span className="text-slate-500 block text-[9px]">RESUME</span>
                <span className="font-semibold text-slate-200">{project.health.resume}</span>
              </div>
              <div className="bg-slate-900/80 p-1.5 rounded border border-slate-800">
                <span className="text-slate-500 block text-[9px]">PORTFOLIO</span>
                <span className="font-semibold text-slate-200">{project.health.portfolio}</span>
              </div>
            </div>

            {project.health.actionItem && (
              <p className="text-[11px] text-amber-400 pt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {project.health.actionItem}
              </p>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
};

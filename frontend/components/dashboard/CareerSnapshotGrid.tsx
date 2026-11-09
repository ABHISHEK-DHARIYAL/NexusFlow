import React from 'react';
import { Card } from '../ui/Card';
import { Award, Code2, FileCheck, Globe, Briefcase, TrendingUp } from 'lucide-react';

interface CareerSnapshotGridProps {
  snapshot: {
    technicalProfile: string;
    dsaScore: number | null;
    resumeScore: number | null;
    portfolioScore: number | null;
    jobReadinessScore: number | null;
    overallGrade: string;
  };
}

export const CareerSnapshotGrid: React.FC<CareerSnapshotGridProps> = ({ snapshot }) => {
  const cards = [
    {
      title: 'Overall Career Grade',
      value: snapshot.overallGrade,
      subtitle: `Status: ${snapshot.technicalProfile}`,
      icon: <Award className="w-5 h-5 text-purple-400" />,
      color: 'border-purple-500/30 bg-purple-950/10 text-purple-200',
    },
    {
      title: 'DSA / CP Profile',
      value: snapshot.dsaScore !== null ? `${snapshot.dsaScore}/100` : 'N/A',
      subtitle: 'LeetCode & Codeforces',
      icon: <Code2 className="w-5 h-5 text-blue-400" />,
      color: 'border-blue-500/30 bg-blue-950/10 text-blue-200',
    },
    {
      title: 'Resume ATS Score',
      value: snapshot.resumeScore !== null ? `${snapshot.resumeScore}/100` : 'N/A',
      subtitle: 'Format & Impact Audit',
      icon: <FileCheck className="w-5 h-5 text-emerald-400" />,
      color: 'border-emerald-500/30 bg-emerald-950/10 text-emerald-200',
    },
    {
      title: 'Portfolio Quality',
      value: snapshot.portfolioScore !== null ? `${snapshot.portfolioScore}/100` : 'N/A',
      subtitle: 'Recruiter UX & SEO',
      icon: <Globe className="w-5 h-5 text-cyan-400" />,
      color: 'border-cyan-500/30 bg-cyan-950/10 text-cyan-200',
    },
    {
      title: 'Target Job Readiness',
      value: snapshot.jobReadinessScore !== null ? `${snapshot.jobReadinessScore}%` : 'N/A',
      subtitle: 'Target Role Alignment',
      icon: <Briefcase className="w-5 h-5 text-amber-400" />,
      color: 'border-amber-500/30 bg-amber-950/10 text-amber-200',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {cards.map((card, idx) => (
        <Card key={idx} className={`p-4 border ${card.color} flex flex-col justify-between space-y-3`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 truncate">{card.title}</span>
            {card.icon}
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-100 tracking-tight">{card.value}</div>
            <div className="text-[11px] text-slate-400 truncate mt-0.5">{card.subtitle}</div>
          </div>
        </Card>
      ))}
    </div>
  );
};

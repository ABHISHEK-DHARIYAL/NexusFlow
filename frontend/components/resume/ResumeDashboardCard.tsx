import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FileCheck, ArrowRight, RefreshCw, Sparkles, CheckCircle2 } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Resume, ResumeAnalysis } from '../../types';

export const ResumeDashboardCard: React.FC = () => {
  const navigate = useNavigate();
  const [resume, setResume] = useState<Resume | null>(null);
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    axios
      .get('/api/resume')
      .then((res) => {
        if (res.data.success && res.data.data) {
          setResume(res.data.data);
          if (res.data.data.analyses && res.data.data.analyses.length > 0) {
            setAnalysis(res.data.data.analyses[0]);
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Card className="flex items-center justify-center p-6 min-h-[160px]">
        <RefreshCw className="w-5 h-5 text-blue-400 animate-spin" />
      </Card>
    );
  }

  if (!resume || !analysis) {
    return (
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <FileCheck className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-slate-100 text-sm">Resume Intelligence</h3>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">PART 14</span>
        </div>

        <p className="text-xs text-slate-400">
          Upload your developer resume for instant ATS compatibility scoring, Google XYZ bullet point rewrites, and keyword gap analysis.
        </p>

        <Button
          onClick={() => navigate('/resume')}
          size="sm"
          className="w-full flex items-center justify-center gap-2"
        >
          <span>Analyze Resume</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      </Card>
    );
  }

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <FileCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-100 text-sm">Resume Intelligence</h3>
            <p className="text-[11px] text-slate-400 font-mono truncate max-w-[200px]">{resume.title}</p>
          </div>
        </div>

        <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30">
          ATS Score: {analysis.atsScore}/100
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-800">
        <div className="p-2 bg-slate-900 rounded-lg text-center">
          <span className="text-[10px] text-slate-500 block">Impact</span>
          <span className="text-xs font-bold text-amber-400">{analysis.contentImpactScore}/100</span>
        </div>
        <div className="p-2 bg-slate-900 rounded-lg text-center">
          <span className="text-[10px] text-slate-500 block">Skills Match</span>
          <span className="text-xs font-bold text-purple-400">{analysis.skillsMatchScore}/100</span>
        </div>
        <div className="p-2 bg-slate-900 rounded-lg text-center">
          <span className="text-[10px] text-slate-500 block">Formatting</span>
          <span className="text-xs font-bold text-emerald-400">{analysis.formattingScore}/100</span>
        </div>
      </div>

      <Button
        onClick={() => navigate('/resume')}
        variant="outline"
        size="sm"
        className="w-full flex items-center justify-center gap-2 border-slate-700 text-slate-300 hover:text-white"
      >
        <span>View ATS Recommendations</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </Button>
    </Card>
  );
};

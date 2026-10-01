import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Globe, ArrowRight, CheckCircle2, RefreshCw, AlertTriangle, ExternalLink } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Portfolio, PortfolioAnalysis } from '../../types';

export const PortfolioDashboardCard: React.FC = () => {
  const navigate = useNavigate();
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [analysis, setAnalysis] = useState<PortfolioAnalysis | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    axios
      .get('/api/portfolio')
      .then((res) => {
        if (res.data.success && res.data.data) {
          setPortfolio(res.data.data);
          if (res.data.data.analyses && res.data.data.analyses.length > 0) {
            setAnalysis(res.data.data.analyses[0]);
          }
        }
      })
      .catch(() => {
        // No connected portfolio or fetch error
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Card className="flex items-center justify-center p-6 min-h-[160px]">
        <RefreshCw className="w-5 h-5 text-blue-400 animate-spin" />
      </Card>
    );
  }

  if (!portfolio) {
    return (
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Globe className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-slate-100 text-sm">Portfolio Intelligence</h3>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">PART 13</span>
        </div>

        <p className="text-xs text-slate-400">
          Connect your developer portfolio for automated SSRF-protected same-domain crawling, SEO & accessibility metrics, and recruiter readiness scoring.
        </p>

        <Button
          onClick={() => navigate('/portfolio')}
          size="sm"
          className="w-full flex items-center justify-center gap-2"
        >
          <span>Connect Portfolio</span>
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
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-100 text-sm">Portfolio Intelligence</h3>
            <p className="text-[11px] text-slate-400 font-mono truncate max-w-[200px]">{portfolio.domain}</p>
          </div>
        </div>

        <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30">
          Quality: {portfolio.qualityScore}/100
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-800">
        <div className="p-2 bg-slate-900 rounded-lg text-center">
          <span className="text-[10px] text-slate-500 block">Readiness</span>
          <span className="text-xs font-bold text-blue-400">{analysis?.recruiterReadinessScore || 0}/100</span>
        </div>
        <div className="p-2 bg-slate-900 rounded-lg text-center">
          <span className="text-[10px] text-slate-500 block">Projects</span>
          <span className="text-xs font-bold text-indigo-400">{portfolio.projects?.length || 0}</span>
        </div>
        <div className="p-2 bg-slate-900 rounded-lg text-center">
          <span className="text-[10px] text-slate-500 block">Pages</span>
          <span className="text-xs font-bold text-emerald-400">{portfolio.pageCount || 0}</span>
        </div>
      </div>

      <Button
        onClick={() => navigate('/portfolio')}
        variant="outline"
        size="sm"
        className="w-full flex items-center justify-center gap-2"
      >
        <span>View Full Portfolio Audit</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </Button>
    </Card>
  );
};

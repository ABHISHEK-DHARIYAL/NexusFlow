import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageContainer } from '../components/layout/PageContainer';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { careerDashboardService } from '../services/careerDashboard.service';
import { ArrowLeft, Sparkles, Loader2, AlertCircle, RefreshCw, Printer, ShieldCheck, CheckCircle2, AlertTriangle, ArrowUpRight } from 'lucide-react';

export const ReportDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await careerDashboardService.getReportById(id);
      setReport(res.data);
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve report details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [id]);

  const handleRefresh = async () => {
    if (!id) return;
    setIsRefreshing(true);
    try {
      const res = await careerDashboardService.refreshReport(id);
      setReport(res.data);
    } catch (err: any) {
      alert(`Failed to refresh report: ${err.message}`);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleExport = () => {
    if (!id) return;
    window.open(`/api/reports/${id}/export`, '_blank');
  };

  if (isLoading) {
    return (
      <PageContainer title="Loading Intelligence Report..." description="Retrieving report details">
        <div className="p-12 flex flex-col items-center justify-center text-slate-400 text-xs gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
          <span>Fetching report data from server...</span>
        </div>
      </PageContainer>
    );
  }

  if (error || !report) {
    return (
      <PageContainer title="Report Not Found" description="The requested report could not be loaded">
        <Card className="p-8 text-center space-y-4 max-w-lg mx-auto border-slate-800">
          <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
          <p className="text-sm text-slate-300">{error || 'Report record not found or access forbidden.'}</p>
          <Button onClick={() => navigate('/analysis/reports')} size="sm">
            Back to Reports
          </Button>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={report.title || `Intelligence Report #${report.id}`}
      description={`Generated on ${new Date(report.createdAt || Date.now()).toLocaleString()}`}
      action={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => navigate('/analysis/reports')}
          >
            Back
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />}
          >
            Refresh Data
          </Button>
          <Button
            size="sm"
            onClick={handleExport}
            leftIcon={<Printer className="w-4 h-4" />}
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold cursor-pointer"
          >
            Print / Export HTML
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Type & Meta Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center gap-2">
            <Badge variant="purple" size="sm">{report.type || 'CAREER'}</Badge>
            <span className="text-xs text-slate-400 font-mono">ID: {report.id}</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
            <span>Status: <strong className="text-emerald-400">{report.freshnessStatus || 'FRESH'}</strong></span>
            <span>Last Updated: {new Date(report.updatedAt || report.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Executive Summary */}
        <Card className="space-y-3 p-6 bg-slate-900 border-slate-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-slate-100 text-base">Executive Summary</h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            {report.summary}
          </p>
        </Card>

        {/* Scores Grid */}
        {report.scores && Object.keys(report.scores).length > 0 && (
          <Card className="p-6 bg-slate-900 border-slate-800 space-y-4">
            <h3 className="font-bold text-slate-100 text-sm">Report Scores & Metrics</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {Object.entries(report.scores).map(([k, v]: [string, any]) => (
                <div key={k} className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 font-mono uppercase block">{k}</span>
                  <span className="text-lg font-bold text-slate-100 mt-1 block">
                    {typeof v === 'object' ? v?.score ?? JSON.stringify(v) : v ?? 'N/A'}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Strengths & Gaps */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Strengths */}
          {report.strengths && report.strengths.length > 0 && (
            <Card className="p-6 bg-slate-900 border-slate-800 space-y-4">
              <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Verified Strengths
              </h3>
              <ul className="space-y-2 text-xs text-slate-300">
                {report.strengths.map((s: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Gaps */}
          {report.gaps && report.gaps.length > 0 && (
            <Card className="p-6 bg-slate-900 border-slate-800 space-y-4">
              <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" /> Identified Gaps
              </h3>
              <ul className="space-y-2 text-xs text-slate-300">
                {report.gaps.map((g: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-amber-400 font-bold">⚠</span>
                    <span>{g}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        {/* Recommendations */}
        {report.recommendations && report.recommendations.length > 0 && (
          <Card className="p-6 bg-slate-900 border-slate-800 space-y-4">
            <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4 text-blue-400" /> Actionable Recommendations
            </h3>
            <ul className="space-y-2 text-xs text-slate-300">
              {report.recommendations.map((r: string, i: number) => (
                <li key={i} className="flex items-start gap-2 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-blue-400 font-bold">→</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {/* Sources Used */}
        {report.sourcesUsed && report.sourcesUsed.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-slate-400 pt-2">
            <span className="font-bold text-slate-500">Sources Analyzed:</span>
            <div className="flex flex-wrap gap-1.5">
              {report.sourcesUsed.map((s: string, i: number) => (
                <span key={i} className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-mono">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
};

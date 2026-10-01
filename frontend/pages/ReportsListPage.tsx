import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '../components/layout/PageContainer';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { careerDashboardService } from '../services/careerDashboard.service';
import { ArrowRight, Loader2, RefreshCw, FileText, Plus, Printer } from 'lucide-react';

export const ReportsListPage: React.FC = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [isGenerating, setIsGenerating] = useState(false);

  const fetchReports = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await careerDashboardService.getUserReports();
      if (res?.data?.all) {
        setReports(res.data.all);
      } else if (Array.isArray(res?.data)) {
        setReports(res.data);
      } else {
        setReports([]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load intelligence reports');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleGenerateReport = async (type: string) => {
    setIsGenerating(true);
    try {
      const res = await careerDashboardService.generateReport(type);
      if (res?.data?.id) {
        navigate(`/analysis/reports/${res.data.id}`);
      } else {
        await fetchReports();
      }
    } catch (err: any) {
      alert(`Failed to generate report: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const filteredReports = reports.filter((r) => {
    if (selectedType === 'ALL') return true;
    return r.type === selectedType;
  });

  const reportTypes = [
    { label: 'All Reports', value: 'ALL' },
    { label: 'Career', value: 'CAREER' },
    { label: 'Resume', value: 'RESUME' },
    { label: 'GitHub', value: 'GITHUB' },
    { label: 'Portfolio', value: 'PORTFOLIO' },
    { label: 'LeetCode', value: 'LEETCODE' },
    { label: 'Codeforces', value: 'CODEFORCES' },
    { label: 'Job Readiness', value: 'READINESS' },
    { label: 'Verification', value: 'VERIFICATION' },
  ];

  return (
    <PageContainer
      title="Intelligence & Career Reports"
      description="Generated executive summaries, ATS audits, codebase analyses, and verification reports."
      action={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchReports}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => handleGenerateReport('CAREER')}
            disabled={isGenerating}
            leftIcon={<Plus className="w-4 h-4" />}
            className="bg-blue-600 hover:bg-blue-500 text-white cursor-pointer"
          >
            {isGenerating ? 'Generating...' : 'New Career Report'}
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Type Filter Chips */}
        <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-800">
          {reportTypes.map((t) => (
            <button
              key={t.value}
              onClick={() => setSelectedType(t.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                selectedType === t.value
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Reports List */}
        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center text-slate-400 text-xs gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
            <span>Loading intelligence reports...</span>
          </div>
        ) : error ? (
          <Card className="p-6 text-center text-xs text-red-300 border-red-800/50 bg-red-950/20">
            Failed to load analysis reports: {error}
          </Card>
        ) : filteredReports.length === 0 ? (
          <Card className="p-8 text-center text-xs text-slate-400 space-y-3">
            <p>No intelligence reports found for filter '{selectedType}'.</p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleGenerateReport(selectedType === 'ALL' ? 'CAREER' : selectedType)}
            >
              Generate {selectedType} Report Now
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredReports.map((rpt) => (
              <Card
                key={rpt.id}
                hoverable
                onClick={() => navigate(`/analysis/reports/${rpt.id}`)}
                className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 cursor-pointer"
              >
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 mt-0.5">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-100 text-sm">{rpt.title || `Report #${rpt.id}`}</h3>
                      <Badge variant="purple" size="sm">{rpt.type || 'CAREER'}</Badge>
                      {rpt.freshnessStatus && (
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/50">
                          {rpt.freshnessStatus}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 line-clamp-2 max-w-2xl">{rpt.summary}</p>
                    <div className="flex items-center gap-4 text-[11px] text-slate-400 font-mono pt-1">
                      <span>Created: {new Date(rpt.createdAt || Date.now()).toLocaleDateString()}</span>
                      {rpt.updatedAt && (
                        <span>Updated: {new Date(rpt.updatedAt).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    View Report
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
};

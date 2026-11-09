import React, { useEffect, useState } from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import {
  ShieldCheck,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  XCircle,
  GitBranch,
  FileText,
  Code2,
  Trophy,
  Globe,
  Layers,
  Sparkles,
  Clock,
  ArrowRight,
  ChevronRight,
  Filter,
} from 'lucide-react';
import {
  CrossPlatformVerificationReport,
  CrossPlatformClaimResult,
  CrossPlatformDiscrepancy,
  ProjectCrossVerification,
  CompetitiveProgrammingVerification,
  TechnologyMatrixItem,
  SourceUsageInfo,
  VerificationStatus,
  DiscrepancySeverity,
} from '../types';
import { useAuthStore } from '../store/useAuthStore';

export const VerificationPage: React.FC = () => {
  const { user } = useAuthStore();
  const [report, setReport] = useState<CrossPlatformVerificationReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [verifying, setVerifying] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'claims' | 'discrepancies' | 'projects' | 'cp' | 'matrix'>('claims');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [error, setError] = useState<string | null>(null);

  const fetchLatestReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/verification/verification');
      if (res.ok) {
        const data = await res.json();
        setReport(data);
      } else if (res.status === 404) {
        setReport(null);
      } else {
        const errData = await res.json().catch(() => ({}));
        setError(errData.error || 'Failed to load verification report');
      }
    } catch (err: any) {
      setError(err.message || 'Network error fetching report');
    } finally {
      setLoading(false);
    }
  };

  const handleInitiateVerification = async () => {
    try {
      setVerifying(true);
      setError(null);
      const res = await fetch('/api/verification/verify', { method: 'POST' });
      if (res.ok) {
        // Poll for completion or fetch after short delay
        setTimeout(() => {
          fetchLatestReport();
          setVerifying(false);
        }, 3500);
      } else {
        const errData = await res.json().catch(() => ({}));
        setError(errData.error || 'Failed to initiate verification');
        setVerifying(false);
      }
    } catch (err: any) {
      setError(err.message || 'Network error initiating verification');
      setVerifying(false);
    }
  };

  useEffect(() => {
    fetchLatestReport();
  }, []);

  const getStatusBadge = (status: VerificationStatus) => {
    switch (status) {
      case 'SUPPORTED':
        return <Badge variant="emerald" size="sm" className="gap-1"><CheckCircle2 className="w-3 h-3" /> Supported</Badge>;
      case 'PARTIALLY_SUPPORTED':
        return <Badge variant="amber" size="sm" className="gap-1"><AlertTriangle className="w-3 h-3" /> Partially Supported</Badge>;
      case 'NOT_FOUND':
        return <Badge variant="slate" size="sm" className="gap-1"><XCircle className="w-3 h-3" /> Not Found</Badge>;
      case 'UNVERIFIABLE':
        return <Badge variant="blue" size="sm" className="gap-1"><HelpCircle className="w-3 h-3" /> Unverifiable</Badge>;
      default:
        return <Badge variant="slate" size="sm">{status}</Badge>;
    }
  };

  const getSeverityBadge = (severity?: DiscrepancySeverity) => {
    switch (severity) {
      case 'HIGH':
        return <Badge variant="rose" size="sm">High</Badge>;
      case 'MEDIUM':
        return <Badge variant="amber" size="sm">Medium</Badge>;
      case 'LOW':
        return <Badge variant="blue" size="sm">Low</Badge>;
      case 'INFO':
        return <Badge variant="slate" size="sm">Info</Badge>;
      default:
        return null;
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'RESUME':
        return <FileText className="w-3.5 h-3.5 text-blue-400" />;
      case 'GITHUB':
        return <GitBranch className="w-3.5 h-3.5 text-purple-400" />;
      case 'LEETCODE':
        return <Code2 className="w-3.5 h-3.5 text-amber-400" />;
      case 'CODEFORCES':
        return <Trophy className="w-3.5 h-3.5 text-rose-400" />;
      case 'PORTFOLIO':
        return <Globe className="w-3.5 h-3.5 text-emerald-400" />;
      default:
        return <Layers className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  if (loading) {
    return (
      <PageContainer title="Cross-Platform Developer Verification">
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-4">
          <RefreshCw className="w-8 h-8 animate-spin text-indigo-400" />
          <p className="text-sm">Loading Cross-Platform Verification Report...</p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Cross-Platform Developer Verification">
      <div className="space-y-6">
        {/* Header Action & Platform Status Bar */}
        <Card className="p-6 bg-slate-900/90 border-slate-800">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
                <h2 className="text-lg font-bold text-white">Cross-Platform Profile Evidence Engine</h2>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Comparing claimed developer accomplishments across Resume, GitHub, LeetCode, Codeforces, and Portfolio.
              </p>
            </div>
            <Button
              onClick={handleInitiateVerification}
              disabled={verifying}
              className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${verifying ? 'animate-spin' : ''}`} />
              {verifying ? 'Analyzing Profile Platforms...' : 'Re-verify Profile Evidence'}
            </Button>
          </div>

          {/* Connected Source Badges & Data Freshness */}
          <div className="mt-4 pt-2">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Connected Data Sources & Sync Timestamps
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {(report?.sourcesUsed || [
                { source: 'RESUME', connected: true, label: 'Resume' },
                { source: 'GITHUB', connected: true, label: 'GitHub' },
                { source: 'LEETCODE', connected: true, label: 'LeetCode' },
                { source: 'CODEFORCES', connected: true, label: 'Codeforces' },
                { source: 'PORTFOLIO', connected: true, label: 'Portfolio' },
              ]).map((src: SourceUsageInfo, idx: number) => {
                const lastSynced = src.lastSyncedAt ? new Date(src.lastSyncedAt) : null;
                const isStale = lastSynced && Date.now() - lastSynced.getTime() > 30 * 86400000;

                return (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-lg border text-xs flex flex-col justify-between ${
                      src.connected
                        ? 'bg-slate-800/60 border-slate-700/80 text-slate-200'
                        : 'bg-slate-950/40 border-slate-800/50 text-slate-500'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-medium">
                        {getSourceIcon(src.source)}
                        <span>{src.label}</span>
                      </div>
                      <span className={`w-2 h-2 rounded-full ${src.connected ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                    </div>
                    <div className="mt-2 text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {lastSynced ? (
                        <span className={isStale ? 'text-amber-400' : ''}>
                          {isStale ? 'Stale: ' : 'Synced: '}{lastSynced.toLocaleDateString()}
                        </span>
                      ) : (
                        <span>{src.connected ? 'Active' : 'Not Connected'}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!report ? (
          <Card className="p-10 text-center space-y-4">
            <ShieldCheck className="w-12 h-12 text-indigo-400 mx-auto" />
            <h3 className="text-base font-semibold text-white">No Verification Report Available</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Run cross-platform verification to compare your resume claims against connected GitHub, LeetCode, Codeforces, and Portfolio accounts.
            </p>
            <Button onClick={handleInitiateVerification} disabled={verifying} className="bg-indigo-600 hover:bg-indigo-500 text-white">
              Run First Verification
            </Button>
          </Card>
        ) : (
          <>
            {/* Summary Score Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-5 bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900 border-indigo-500/30">
                <span className="text-xs font-medium text-slate-400 block">Technical Consistency</span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-extrabold text-white">{report.technicalConsistencyScore}</span>
                  <span className="text-xs text-indigo-400 font-semibold">/ 100</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-2">Cross-platform technical stack & claims alignment score.</p>
              </Card>

              <Card className="p-5 bg-slate-900/90 border-slate-800">
                <span className="text-xs font-medium text-slate-400 block">Evidence Coverage Score</span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-extrabold text-emerald-400">{report.overallCoverageScore}%</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-2">
                  {report.verifiedClaimsCount} Supported, {report.partialClaimsCount} Partial, {report.unverifiableClaimsCount} Unverifiable.
                </p>
              </Card>

              <Card className="p-5 bg-slate-900/90 border-slate-800">
                <span className="text-xs font-medium text-slate-400 block">Flagged Discrepancies</span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-extrabold text-amber-400">{report.discrepancyCount}</span>
                  <span className="text-xs text-slate-400">items</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-2">Minor numerical or platform record variance flagged for alignment.</p>
              </Card>

              <Card className="p-5 bg-slate-900/90 border-slate-800">
                <span className="text-xs font-medium text-slate-400 block">Verified Projects & CP</span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-extrabold text-purple-400">{report.projectCrossVerifications?.length || 0}</span>
                  <span className="text-xs text-slate-400">projects</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-2">
                  CP Rating: {report.cpConsistencyScore}% consistency.
                </p>
              </Card>
            </div>

            {/* AI Executive Summary & Strong Profile Signals */}
            <Card className="p-6 bg-slate-900 border-slate-800 space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">Executive Multi-Platform Evidence Summary</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
                {report.summary}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {/* Strong Signals */}
                <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-800/30 space-y-2">
                  <h4 className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Strong Verified Profile Signals
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {(report.strongProfileSignals || []).map((sig: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-emerald-400 font-bold">•</span>
                        <span>{sig}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Recommendations */}
                <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-800/30 space-y-2">
                  <h4 className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" /> Recommended Profile Alignment Actions
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {(report.recommendations || []).map((rec: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-amber-400 font-bold">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>

            {/* Tab Navigation */}
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
              <button
                onClick={() => setActiveTab('claims')}
                className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === 'claims'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                Evaluated Claims ({report.claims?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('discrepancies')}
                className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === 'discrepancies'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                Discrepancies ({report.discrepancies?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('projects')}
                className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === 'projects'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                Projects Cross-Verification ({report.projectCrossVerifications?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('cp')}
                className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === 'cp'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                Competitive Programming ({report.competitiveProgrammingVerifications?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('matrix')}
                className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === 'matrix'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                Technology Matrix ({report.technologyMatrix?.length || 0})
              </button>
            </div>

            {/* Tab 1: Claims List */}
            {activeTab === 'claims' && (
              <Card className="p-6 bg-slate-900 border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <h3 className="text-sm font-bold text-white">Extracted Profile Claims & Multi-Source Status</h3>
                  <div className="flex items-center gap-2">
                    <Filter className="w-3.5 h-3.5 text-slate-400" />
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5"
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="SUPPORTED">Supported</option>
                      <option value="PARTIALLY_SUPPORTED">Partially Supported</option>
                      <option value="NOT_FOUND">Not Found</option>
                      <option value="UNVERIFIABLE">Unverifiable</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-3">
                  {(report.claims || [])
                    .filter((c) => statusFilter === 'ALL' || c.status === statusFilter)
                    .map((claim: CrossPlatformClaimResult, idx: number) => (
                      <div key={idx} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="purple" size="sm">{claim.category}</Badge>
                            <span className="text-xs font-semibold text-white">{claim.claimText}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(claim.status)}
                          </div>
                        </div>

                        <p className="text-xs text-slate-400">{claim.reason}</p>

                        {claim.evidence && claim.evidence.length > 0 && (
                          <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-300">
                            <span className="text-slate-500 font-medium">Cross-Platform Evidence:</span>
                            {claim.evidence.map((ev, evIdx) => (
                              <span
                                key={evIdx}
                                className="inline-flex items-center gap-1.5 bg-slate-800/80 border border-slate-700/60 px-2 py-0.5 rounded-md"
                              >
                                {getSourceIcon(ev.source)}
                                <span className="font-mono">{ev.metric}:</span>
                                <span className="text-indigo-300 font-medium">{String(ev.value)}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </Card>
            )}

            {/* Tab 2: Discrepancies */}
            {activeTab === 'discrepancies' && (
              <Card className="p-6 bg-slate-900 border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-white">Flagged Profile Discrepancies</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Objective comparison between resume claims and actual connected platform data. Non-accusatory.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Filter className="w-3.5 h-3.5 text-slate-400" />
                    <select
                      value={severityFilter}
                      onChange={(e) => setSeverityFilter(e.target.value)}
                      className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5"
                    >
                      <option value="ALL">All Severities</option>
                      <option value="HIGH">High</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="LOW">Low</option>
                      <option value="INFO">Info</option>
                    </select>
                  </div>
                </div>

                {report.discrepancies?.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    No cross-platform discrepancies detected. Resume claims closely align with connected profiles.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(report.discrepancies || [])
                      .filter((d) => severityFilter === 'ALL' || d.severity === severityFilter)
                      .map((disc: CrossPlatformDiscrepancy, idx: number) => (
                        <div key={idx} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge variant="amber" size="sm">{disc.category}</Badge>
                              {getSeverityBadge(disc.severity)}
                            </div>
                            <span className="text-[10px] text-slate-500">{new Date(disc.timestamp).toLocaleDateString()}</span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-900 p-3 rounded-lg border border-slate-800">
                            <div className="flex items-center gap-2">
                              {getSourceIcon(disc.sourceA)}
                              <div>
                                <span className="text-slate-500 text-[10px] block">{disc.sourceA} Value</span>
                                <span className="font-semibold text-slate-200">{disc.observedValueA}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {getSourceIcon(disc.sourceB)}
                              <div>
                                <span className="text-slate-500 text-[10px] block">{disc.sourceB} Value</span>
                                <span className="font-semibold text-indigo-300">{disc.observedValueB}</span>
                              </div>
                            </div>
                          </div>

                          <p className="text-xs text-slate-300">{disc.explanation}</p>

                          {disc.recommendedAction && (
                            <div className="text-xs text-amber-300/90 bg-amber-950/20 p-2.5 rounded-lg border border-amber-900/30 flex items-center gap-2">
                              <ArrowRight className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                              <span>{disc.recommendedAction}</span>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                )}
              </Card>
            )}

            {/* Tab 3: Projects Cross-Verification */}
            {activeTab === 'projects' && (
              <Card className="p-6 bg-slate-900 border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-white">Project Multi-Source Alignment</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left text-slate-300">
                    <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="p-3">Project Name</th>
                        <th className="p-3">Resume</th>
                        <th className="p-3">GitHub Repo</th>
                        <th className="p-3">Portfolio</th>
                        <th className="p-3">Match Score</th>
                        <th className="p-3">Tech Consistency</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {(report.projectCrossVerifications || []).map((proj: ProjectCrossVerification, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-850/50">
                          <td className="p-3 font-semibold text-white">{proj.projectName}</td>
                          <td className="p-3">
                            {proj.resumePresent ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <XCircle className="w-4 h-4 text-slate-600" />
                            )}
                          </td>
                          <td className="p-3 font-mono text-[11px] text-purple-300">
                            {proj.githubRepoName || '-'}
                          </td>
                          <td className="p-3 text-emerald-300">
                            {proj.portfolioProjectName || '-'}
                          </td>
                          <td className="p-3 font-bold text-indigo-400">{proj.matchScore}%</td>
                          <td className="p-3 font-bold text-emerald-400">{proj.technologyConsistency}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {/* Tab 4: Competitive Programming */}
            {activeTab === 'cp' && (
              <Card className="p-6 bg-slate-900 border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-white">Competitive Programming Cross-Verification</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(report.competitiveProgrammingVerifications || []).map((cp: CompetitiveProgrammingVerification, idx: number) => (
                    <div key={idx} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getSourceIcon(cp.platform)}
                          <span className="text-xs font-bold text-white">{cp.platform} - {cp.metric}</span>
                        </div>
                        {getStatusBadge(cp.status)}
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs bg-slate-900 p-3 rounded-lg border border-slate-800/80">
                        <div>
                          <span className="text-[10px] text-slate-500 block">Resume Stated</span>
                          <span className="font-semibold text-slate-200">{cp.resumeValue ?? 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">Actual Platform Data</span>
                          <span className="font-semibold text-indigo-300">{cp.actualValue ?? 'N/A'}</span>
                        </div>
                      </div>

                      <div className="text-[10px] text-slate-500 flex items-center justify-between pt-1">
                        <span>Last Synced: {new Date(cp.lastUpdated).toLocaleDateString()}</span>
                        {cp.notes && <span className="text-amber-400">{cp.notes}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Tab 5: Technology Matrix */}
            {activeTab === 'matrix' && (
              <Card className="p-6 bg-slate-900 border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-white">Multi-Source Technology Evidence Matrix</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {(report.technologyMatrix || []).map((item: TechnologyMatrixItem, idx: number) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white">{item.technology}</span>
                        {getStatusBadge(item.status)}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1">
                        <span className={item.resumePresent ? 'text-blue-400 font-medium' : 'opacity-40'}>Resume</span>
                        <span>•</span>
                        <span className={item.githubPresent ? 'text-purple-400 font-medium' : 'opacity-40'}>GitHub</span>
                        <span>•</span>
                        <span className={item.portfolioPresent ? 'text-emerald-400 font-medium' : 'opacity-40'}>Portfolio</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </PageContainer>
  );
};

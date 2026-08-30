import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  XCircle,
  Code2,
  GitBranch,
  Star,
  Sparkles,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Info,
  Layers,
  FileCode,
  Zap,
  ArrowUpRight
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { ResumeGitHubVerification, ResumeClaim, VerificationStatus } from '../../types';

interface ResumeGitHubVerificationTabProps {
  resumeId: string;
}

export const ResumeGitHubVerificationTab: React.FC<ResumeGitHubVerificationTabProps> = ({ resumeId }) => {
  const [verification, setVerification] = useState<ResumeGitHubVerification | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [verifying, setVerifying] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [expandedClaimId, setExpandedClaimId] = useState<string | null>(null);

  useEffect(() => {
    fetchVerification();
  }, [resumeId]);

  const fetchVerification = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/resume/${resumeId}/github-verification`);
      if (res.data.success) {
        setVerification(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch GitHub verification:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunVerification = async () => {
    try {
      setVerifying(true);
      const res = await axios.post(`/api/resume/${resumeId}/verify/github`);
      if (res.data.success) {
        // Poll for completion
        setTimeout(() => {
          fetchVerification();
          setVerifying(false);
        }, 2500);
      }
    } catch (err) {
      console.error('Failed to run verification:', err);
      setVerifying(false);
    }
  };

  const getStatusBadge = (status: VerificationStatus) => {
    switch (status) {
      case 'SUPPORTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>SUPPORTED</span>
          </span>
        );
      case 'PARTIALLY_SUPPORTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>PARTIALLY SUPPORTED</span>
          </span>
        );
      case 'NOT_FOUND':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/30">
            <XCircle className="w-3.5 h-3.5" />
            <span>NOT FOUND</span>
          </span>
        );
      case 'UNVERIFIABLE':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/30">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>UNVERIFIABLE</span>
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <RefreshCw className="w-6 h-6 text-blue-400 animate-spin" />
      </div>
    );
  }

  if (!verification) {
    return (
      <Card className="p-8 text-center space-y-4 bg-slate-900/50 border-slate-800">
        <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mx-auto">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-100">Resume ↔ GitHub Verification</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
            Compare technical claims extracted from your resume against evidence available in your connected GitHub repositories.
          </p>
        </div>
        <Button onClick={handleRunVerification} disabled={verifying} className="flex items-center gap-2 mx-auto">
          {verifying ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
          <span>Run Resume ↔ GitHub Verification</span>
        </Button>
      </Card>
    );
  }

  const filteredClaims = verification.claims.filter((claim) => {
    if (statusFilter === 'ALL') return true;
    return claim.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Gauge Card */}
        <Card className="p-5 md:col-span-2 bg-gradient-to-br from-blue-950/30 to-slate-900 border-blue-500/30 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-blue-400 tracking-wider uppercase">
                Evidence Coverage Score
              </span>
              <p className="text-xs text-slate-400 mt-0.5">Technically verified claims on GitHub</p>
            </div>
            <ShieldCheck className="w-6 h-6 text-blue-400" />
          </div>

          <div className="my-4 flex items-baseline gap-2">
            <span className="text-4xl font-black text-slate-100">{verification.overallCoverageScore}%</span>
            <span className="text-xs text-slate-400">coverage rate</span>
          </div>

          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-emerald-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${verification.overallCoverageScore}%` }}
            />
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
            <span className="text-xs text-slate-400">Last verified: {new Date(verification.createdAt).toLocaleDateString()}</span>
            <Button
              onClick={handleRunVerification}
              disabled={verifying}
              variant="outline"
              size="sm"
              className="text-xs border-slate-700 text-slate-300"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${verifying ? 'animate-spin' : ''}`} />
              <span>Re-verify</span>
            </Button>
          </div>
        </Card>

        {/* Claim Counters */}
        <div className="md:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="p-4 bg-slate-900/60 border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-emerald-400">
              <span className="text-xs font-semibold uppercase">Supported</span>
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-slate-100">{verification.verifiedClaimsCount}</span>
              <p className="text-[10px] text-slate-400 mt-0.5">Direct GitHub evidence</p>
            </div>
          </Card>

          <Card className="p-4 bg-slate-900/60 border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-amber-400">
              <span className="text-xs font-semibold uppercase">Partial</span>
              <AlertCircle className="w-4 h-4" />
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-slate-100">{verification.partialClaimsCount}</span>
              <p className="text-[10px] text-slate-400 mt-0.5">Indirect / config match</p>
            </div>
          </Card>

          <Card className="p-4 bg-slate-900/60 border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase">Not Found</span>
              <XCircle className="w-4 h-4" />
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-slate-100">{verification.notFoundClaimsCount}</span>
              <p className="text-[10px] text-slate-400 mt-0.5">No repo evidence</p>
            </div>
          </Card>

          <Card className="p-4 bg-slate-900/60 border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-purple-400">
              <span className="text-xs font-semibold uppercase">Unverifiable</span>
              <HelpCircle className="w-4 h-4" />
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-slate-100">{verification.unverifiableClaimsCount}</span>
              <p className="text-[10px] text-slate-400 mt-0.5">Requires external APM</p>
            </div>
          </Card>
        </div>
      </div>

      {/* Verification Executive Summary */}
      <Card className="p-5 bg-slate-900/80 border-slate-800 space-y-2">
        <div className="flex items-center gap-2 text-blue-400 text-xs font-semibold">
          <Info className="w-4 h-4" />
          <span>Verification Philosophy & Executive Summary</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">{verification.summary}</p>
        <p className="text-[11px] text-slate-400 italic pt-1 border-t border-slate-800/60">
          "GitHub is supporting evidence, not absolute truth. Claims marked as NOT_FOUND or UNVERIFIABLE indicate missing repo proof in NexusFlow, not false information."
        </p>
      </Card>

      {/* Main Section: Claims & Verification Grid */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <FileCode className="w-4 h-4 text-blue-400" />
            <span>Extracted Claims Verification ({verification.claims.length})</span>
          </h3>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {['ALL', 'SUPPORTED', 'PARTIALLY_SUPPORTED', 'NOT_FOUND', 'UNVERIFIABLE'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
                  statusFilter === st
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Claims List */}
        <div className="space-y-3">
          {filteredClaims.map((claim) => {
            const isExpanded = expandedClaimId === claim.claimId;
            return (
              <Card
                key={claim.claimId}
                className="p-4 bg-slate-900/50 border-slate-800 hover:border-slate-700 transition"
              >
                <div className="flex items-start justify-between gap-4 cursor-pointer" onClick={() => setExpandedClaimId(isExpanded ? null : claim.claimId)}>
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-800 text-blue-400 border border-slate-700">
                        {claim.claimType}
                      </span>
                      <span className="text-[11px] text-slate-400">Section: {claim.sourceSection}</span>
                      {claim.projectName && (
                        <span className="text-[11px] text-slate-400 font-medium">| Project: {claim.projectName}</span>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-slate-200">{claim.claimText}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    {getStatusBadge(claim.status)}
                    <button className="text-slate-500 hover:text-slate-300">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-3 text-xs">
                    <div>
                      <span className="text-[11px] font-medium text-slate-400">Reasoning & Verification Assessment:</span>
                      <p className="text-slate-300 mt-0.5">{claim.reason}</p>
                    </div>

                    {claim.evidencePaths && claim.evidencePaths.length > 0 && (
                      <div>
                        <span className="text-[11px] font-medium text-slate-400">Evidence File Paths:</span>
                        <div className="mt-1 space-y-1">
                          {claim.evidencePaths.map((path, idx) => (
                            <div key={idx} className="flex items-center gap-2 font-mono text-[11px] text-emerald-400 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
                              <Code2 className="w-3.5 h-3.5 text-slate-500" />
                              <span>{path}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {claim.evidenceSnippets && claim.evidenceSnippets.length > 0 && (
                      <div>
                        <span className="text-[11px] font-medium text-slate-400">Evidence Snippets:</span>
                        <div className="mt-1 bg-slate-950 p-2.5 rounded border border-slate-800 font-mono text-[11px] text-slate-300 space-y-1">
                          {claim.evidenceSnippets.map((snip, idx) => (
                            <p key={idx}>{snip}</p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>

      {/* Project Matching Section */}
      {verification.projectMatches && verification.projectMatches.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-slate-800">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-emerald-400" />
            <span>Project-by-Project Cross-Verification ({verification.projectMatches.length})</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {verification.projectMatches.map((pm, i) => (
              <Card key={i} className="p-4 bg-slate-900/60 border-slate-800 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-slate-100">{pm.projectName}</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {pm.matchedRepoName ? (
                        <span className="text-emerald-400 font-mono">Matched: {pm.matchedRepoName}</span>
                      ) : (
                        <span className="text-slate-500">No matching GitHub repository linked</span>
                      )}
                    </p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                    pm.matchScore > 70 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {pm.matchScore}% match
                  </span>
                </div>

                {pm.technologiesClaimed.length > 0 && (
                  <div className="space-y-1.5 text-xs">
                    <span className="text-[11px] text-slate-400 font-medium">Technologies Claimed:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {pm.technologiesClaimed.map((tech, tidx) => {
                        const isVerified = pm.technologiesVerified.includes(tech);
                        return (
                          <span
                            key={tidx}
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium ${
                              isVerified
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}
                          >
                            {tech} {isVerified ? '✓' : '?'}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Strong GitHub Projects Suggestions */}
      {verification.strongProjects && verification.strongProjects.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-slate-800">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Strong Unlisted GitHub Repositories (Suggestions for Resume)</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {verification.strongProjects.map((sp) => (
              <Card key={sp.repositoryId} className="p-4 bg-slate-900/60 border-amber-500/20 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-100">{sp.suggestedTitle}</h4>
                    <span className="text-[10px] font-mono text-amber-400">{sp.repositoryName}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    {sp.language}
                  </span>
                </div>

                <p className="text-xs text-slate-300">{sp.description}</p>

                <div className="space-y-1 border-t border-slate-800/80 pt-2">
                  <span className="text-[10px] font-semibold text-slate-400">Suggested Resume Highlights:</span>
                  {sp.suggestedHighlights.map((hl, hidx) => (
                    <p key={hidx} className="text-[11px] text-slate-300 flex items-start gap-1.5">
                      <span className="text-amber-400">•</span>
                      <span>{hl}</span>
                    </p>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {verification.recommendations && verification.recommendations.length > 0 && (
        <Card className="p-5 bg-slate-900/60 border-slate-800 space-y-3">
          <h3 className="text-xs font-bold text-slate-100 flex items-center gap-2">
            <Zap className="w-4 h-4 text-blue-400" />
            <span>Recommendations to Boost Resume ↔ GitHub Alignment</span>
          </h3>
          <div className="space-y-2">
            {verification.recommendations.map((rec, idx) => (
              <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-300">
                <span className="w-5 h-5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <p className="leading-relaxed">{rec}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

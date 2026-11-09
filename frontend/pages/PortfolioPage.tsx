import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'motion/react';
import {
  Globe,
  RefreshCw,
  Search,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Code2,
  FileCode,
  Layout,
  FileText,
  UserCheck,
  TrendingUp,
  Briefcase,
  Trash2,
  Sparkles,
  Link2,
  FolderGit2,
  Layers,
  ArrowRight
} from 'lucide-react';
import { Portfolio, PortfolioAnalysis } from '../types';

export const PortfolioPage: React.FC = () => {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [analysis, setAnalysis] = useState<PortfolioAnalysis | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [portfolioUrl, setPortfolioUrl] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'projects' | 'pages' | 'links'>('overview');

  const fetchPortfolioData = async () => {
    try {
      setError(null);
      const res = await axios.get('/api/portfolio');
      if (res.data.success && res.data.data) {
        setPortfolio(res.data.data);
        if (res.data.data.analyses && res.data.data.analyses.length > 0) {
          setAnalysis(res.data.data.analyses[0]);
        }
      }
    } catch (err: any) {
      if (err.response?.status !== 404) {
        setError(err.response?.data?.message || 'Failed to load portfolio intelligence data.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolioData();
  }, []);

  // Poll when crawl is active
  useEffect(() => {
    if (portfolio?.crawlStatus === 'CRAWLING' || portfolio?.crawlStatus === 'QUEUED') {
      const interval = setInterval(() => {
        fetchPortfolioData();
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [portfolio?.crawlStatus]);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!portfolioUrl.trim()) return;

    try {
      setSubmitting(true);
      setError(null);
      const res = await axios.post('/api/portfolio/connect', { url: portfolioUrl.trim() });
      if (res.data.success) {
        setPortfolioUrl('');
        await fetchPortfolioData();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to initiate portfolio crawl.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to disconnect this portfolio?')) return;
    try {
      setLoading(true);
      await axios.delete('/api/portfolio');
      setPortfolio(null);
      setAnalysis(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to disconnect portfolio.');
    } finally {
      setLoading(false);
    }
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    if (score >= 60) return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-sm font-medium text-slate-400">Loading Portfolio Intelligence...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Globe className="w-6 h-6 text-blue-400" />
            <h1 className="text-xl font-bold text-slate-100">Portfolio Intelligence</h1>
            <span className="px-2.5 py-0.5 text-[11px] font-semibold tracking-wider rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400">
              PART 13
            </span>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl">
            NexusFlow performs a secure, same-domain crawl of your developer portfolio to analyze SEO, accessibility, navigation, and recruiter readiness with Gemini recommendations.
          </p>
        </div>

        {portfolio && (
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={fetchPortfolioData}
              className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={handleDelete}
              className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 transition cursor-pointer"
              title="Disconnect Portfolio"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Connection Form if no portfolio */}
      {!portfolio && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-xl max-w-2xl mx-auto space-y-6"
        >
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mx-auto">
              <Globe className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-100">Connect Portfolio Website</h2>
            <p className="text-xs text-slate-400">
              Provide your personal website or portfolio URL for controlled crawling and technical analysis.
            </p>
          </div>

          <form onSubmit={handleConnect} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Portfolio Website URL</label>
              <div className="relative">
                <Globe className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  placeholder="https://janedoe.dev"
                  value={portfolioUrl}
                  onChange={(e) => setPortfolioUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50"
                  required
                />
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>SSRF-Protected, Same-Domain Crawl with strict timeout & rate-limiting.</span>
            </div>

            <button
              type="submit"
              disabled={submitting || !portfolioUrl.trim()}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white text-xs font-semibold transition flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 cursor-pointer"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Initiating Crawl & Analysis...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Crawl & Analyze Portfolio</span>
                </>
              )}
            </button>
          </form>

          {/* Testing / Quick Fill Demo URL */}
          <div className="pt-4 border-t border-slate-800/80 text-center">
            <span className="text-[11px] text-slate-500">Need to test without external network? </span>
            <button
              type="button"
              onClick={() => setPortfolioUrl('https://portfolio.test')}
              className="text-[11px] text-blue-400 hover:underline font-mono ml-1"
            >
              Use https://portfolio.test
            </button>
          </div>
        </motion.div>
      )}

      {/* Portfolio Connected & Results */}
      {portfolio && (
        <div className="space-y-6">
          {/* Status Bar / Active Crawl Banner */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <a
                  href={portfolio.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-bold text-slate-100 hover:text-blue-400 transition flex items-center gap-1.5"
                >
                  <span>{portfolio.url}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <p className="text-xs text-slate-400">
                  Domain: <span className="text-slate-200 font-mono">{portfolio.domain}</span> • Crawled Pages:{' '}
                  <span className="text-slate-200 font-semibold">{portfolio.pageCount}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {portfolio.crawlStatus === 'CRAWLING' || portfolio.crawlStatus === 'QUEUED' ? (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-medium animate-pulse">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Crawl & Analysis in Progress...</span>
                </div>
              ) : portfolio.crawlStatus === 'COMPLETED' ? (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Crawl & Analysis Ready</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Crawl Failed</span>
                </div>
              )}
            </div>
          </div>

          {/* Deterministic Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
              <span className="text-[11px] font-medium text-slate-400">Quality Score</span>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-2xl font-bold text-slate-100">{portfolio.qualityScore || 0}</span>
                <span className="text-xs text-slate-500">/100</span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
              <span className="text-[11px] font-medium text-slate-400">Recruiter Readiness</span>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-2xl font-bold text-blue-400">
                  {analysis?.recruiterReadinessScore || 0}
                </span>
                <span className="text-xs text-slate-500">/100</span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
              <span className="text-[11px] font-medium text-slate-400">Project Presentation</span>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-2xl font-bold text-indigo-400">
                  {analysis?.projectPresentationScore || 0}
                </span>
                <span className="text-xs text-slate-500">/100</span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
              <span className="text-[11px] font-medium text-slate-400">Navigation</span>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-2xl font-bold text-purple-400">
                  {analysis?.navigationScore || 0}
                </span>
                <span className="text-xs text-slate-500">/100</span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
              <span className="text-[11px] font-medium text-slate-400">SEO Score</span>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-2xl font-bold text-emerald-400">
                  {analysis?.seoScore || 0}
                </span>
                <span className="text-xs text-slate-500">/100</span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
              <span className="text-[11px] font-medium text-slate-400">Accessibility</span>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-2xl font-bold text-amber-400">
                  {analysis?.accessibilityScore || 0}
                </span>
                <span className="text-xs text-slate-500">/100</span>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-1 overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-2 ${
                activeTab === 'overview'
                  ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>AI Analysis & Recommendations</span>
            </button>

            <button
              onClick={() => setActiveTab('projects')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-2 ${
                activeTab === 'projects'
                  ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              <span>Extracted Projects ({portfolio.projects?.length || 0})</span>
            </button>

            <button
              onClick={() => setActiveTab('pages')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-2 ${
                activeTab === 'pages'
                  ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Crawled Pages ({portfolio.pages?.length || 0})</span>
            </button>

            <button
              onClick={() => setActiveTab('links')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-2 ${
                activeTab === 'links'
                  ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Link2 className="w-4 h-4" />
              <span>Links & Audit ({portfolio.links?.length || 0})</span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="space-y-6">
            {activeTab === 'overview' && analysis && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                {/* Executive Summary */}
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 text-blue-400 font-semibold text-sm">
                    <Sparkles className="w-4 h-4" />
                    <span>Gemini Executive Summary</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{analysis.summary}</p>
                </div>

                {/* Recruiter Perspective */}
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
                    <UserCheck className="w-4 h-4" />
                    <span>Recruiter Perspective (First 10 Seconds)</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{analysis.recruiterPerspective}</p>
                </div>

                {/* Strengths & Weaknesses Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-3">
                    <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Portfolio Strengths</span>
                    </div>
                    <ul className="space-y-2">
                      {((analysis.strengths as string[]) || []).map((s, idx) => (
                        <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-3">
                    <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Improvement Opportunities</span>
                    </div>
                    <ul className="space-y-2">
                      {((analysis.weaknesses as string[]) || []).map((w, idx) => (
                        <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                          <span>{w}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Specific Recommendations */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3">
                    <h3 className="text-xs font-bold text-slate-100 flex items-center gap-2">
                      <Search className="w-4 h-4 text-emerald-400" />
                      <span>SEO Recommendations</span>
                    </h3>
                    <ul className="space-y-2">
                      {((analysis.seoRecommendations as string[]) || []).map((rec, idx) => (
                        <li key={idx} className="text-[11px] text-slate-300 flex items-start gap-2">
                          <span className="text-emerald-400">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3">
                    <h3 className="text-xs font-bold text-slate-100 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-amber-400" />
                      <span>Accessibility Fixes</span>
                    </h3>
                    <ul className="space-y-2">
                      {((analysis.accessibilityRecommendations as string[]) || []).map((rec, idx) => (
                        <li key={idx} className="text-[11px] text-slate-300 flex items-start gap-2">
                          <span className="text-amber-400">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3">
                    <h3 className="text-xs font-bold text-slate-100 flex items-center gap-2">
                      <Layout className="w-4 h-4 text-blue-400" />
                      <span>Design & Content</span>
                    </h3>
                    <ul className="space-y-2">
                      {((analysis.designContentRecommendations as string[]) || []).map((rec, idx) => (
                        <li key={idx} className="text-[11px] text-slate-300 flex items-start gap-2">
                          <span className="text-blue-400">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Phased Roadmap */}
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
                  <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-400" />
                    <span>Phased Portfolio Improvement Roadmap</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {((analysis.improvementRoadmap as any[]) || []).map((phase, idx) => (
                      <div key={idx} className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-blue-400">{phase.phase}</span>
                          <span className="text-[10px] text-slate-500 font-mono">{phase.focus}</span>
                        </div>
                        <ul className="space-y-1.5 pt-1">
                          {(phase.milestones || []).map((m: string, mIdx: number) => (
                            <li key={mIdx} className="text-xs text-slate-300 flex items-center gap-2">
                              <ArrowRight className="w-3 h-3 text-blue-500 shrink-0" />
                              <span>{m}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'projects' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                {(!portfolio.projects || portfolio.projects.length === 0) ? (
                  <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl text-center text-slate-400 text-xs">
                    No structured project blocks automatically detected during same-domain crawl.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {portfolio.projects.map((proj) => (
                      <div
                        key={proj.id}
                        className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3 flex flex-col justify-between"
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="text-sm font-bold text-slate-100">{proj.name}</h3>
                            <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
                              Score: {proj.presentationScore}/100
                            </span>
                          </div>
                          {proj.description && (
                            <p className="text-xs text-slate-400 line-clamp-3">{proj.description}</p>
                          )}
                        </div>

                        <div className="space-y-3 pt-2">
                          {proj.technologies && proj.technologies.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {proj.technologies.map((t, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 text-[10px] font-mono rounded bg-slate-800 text-slate-300 border border-slate-700"
                                >
                                  {t}
                                </span>
                              ))}
                            </div>
                          )}

                          <div className="flex items-center gap-3 pt-2 border-t border-slate-800/80 text-xs">
                            {proj.githubUrl && (
                              <a
                                href={proj.githubUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:underline flex items-center gap-1 text-[11px]"
                              >
                                <FolderGit2 className="w-3.5 h-3.5" />
                                <span>GitHub</span>
                              </a>
                            )}
                            {proj.liveDemoUrl && (
                              <a
                                href={proj.liveDemoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-emerald-400 hover:underline flex items-center gap-1 text-[11px]"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>Live Demo</span>
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'pages' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                {portfolio.pages?.map((page) => (
                  <div key={page.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <FileCode className="w-4 h-4 text-blue-400 shrink-0" />
                        <span className="text-xs font-bold text-slate-100">{page.path}</span>
                        <span className="text-[10px] text-slate-500 font-mono">Depth {page.depth}</span>
                      </div>
                      <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        {page.statusCode} OK • {page.wordCount} words
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 font-medium">{page.title || 'Untitled Page'}</p>
                    {page.metaDescription && (
                      <p className="text-[11px] text-slate-400 italic">"{page.metaDescription}"</p>
                    )}
                  </div>
                ))}
              </motion.div>
            )}

            {activeTab === 'links' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2">
                  <h3 className="text-xs font-bold text-slate-100 flex items-center gap-2">
                    <Link2 className="w-4 h-4 text-blue-400" />
                    <span>Link Audit Summary</span>
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                    <div className="p-3 bg-slate-950 rounded-lg text-center">
                      <span className="text-[10px] text-slate-500">Internal Links</span>
                      <p className="text-sm font-bold text-slate-200">
                        {portfolio.links?.filter((l) => l.linkType === 'INTERNAL').length || 0}
                      </p>
                    </div>
                    <div className="p-3 bg-slate-950 rounded-lg text-center">
                      <span className="text-[10px] text-slate-500">GitHub Links</span>
                      <p className="text-sm font-bold text-blue-400">
                        {portfolio.links?.filter((l) => l.linkType === 'GITHUB').length || 0}
                      </p>
                    </div>
                    <div className="p-3 bg-slate-950 rounded-lg text-center">
                      <span className="text-[10px] text-slate-500">Resume Links</span>
                      <p className="text-sm font-bold text-emerald-400">
                        {portfolio.links?.filter((l) => l.linkType === 'RESUME').length || 0}
                      </p>
                    </div>
                    <div className="p-3 bg-slate-950 rounded-lg text-center">
                      <span className="text-[10px] text-slate-500">Broken Links</span>
                      <p className="text-sm font-bold text-rose-400">
                        {portfolio.links?.filter((l) => l.isBroken).length || 0}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

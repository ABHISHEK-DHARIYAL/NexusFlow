import React, { useEffect, useState } from 'react';
import {
  Briefcase,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Layers,
  Sparkles,
  ArrowRight,
  TrendingUp,
  FileCode,
  GraduationCap,
  Code,
  Award,
  RefreshCw,
  Plus,
  Trash2,
  ExternalLink,
  ChevronRight,
  Check,
  Building2,
  MapPin,
  Clock,
  Target,
  ShieldCheck,
  Zap,
  BarChart2,
  Sliders,
  AlertOctagon,
  BookOpen,
  Cpu,
} from 'lucide-react';
import {
  ExtractedJobRequirements,
  JobDescriptionRecord,
  JobMatchReport,
  JobMatchingState,
  JobReadinessReport,
  JobReadinessWhatIfScenario,
  CompanyPreparationReport,
} from '../types';
import { CompanyPreparationView } from '../components/jobs/CompanyPreparationView';

const SAMPLE_JOBS = [
  {
    title: 'Senior Full Stack Engineer',
    company: 'NexusTech Labs',
    location: 'Remote / San Francisco',
    employmentType: 'Full-time',
    description: `About the Role:
We are seeking a Senior Full Stack Engineer with 3+ years of experience to join our core architecture team.

Requirements:
• Strong expertise in TypeScript, React, Node.js, and Express.js
• Deep experience with PostgreSQL, Prisma ORM, and database indexing
• Proven ability with Docker, CI/CD pipelines, and GitHub Actions
• Experience building scalable RESTful APIs and WebSocket real-time systems
• BS/MS in Computer Science or equivalent practical experience

Nice to Have / Bonus:
• Familiarity with Kubernetes, AWS services (EC2, S3), and Terraform
• Background in competitive programming (LeetCode / Codeforces) or strong DSA background
• Experience with Redis caching and microservices architecture`,
  },
  {
    title: 'Backend Systems Engineer',
    company: 'FinCloud Systems',
    location: 'New York, NY',
    employmentType: 'Full-time',
    description: `Role Overview:
FinCloud Systems is building next-generation high-throughput financial infrastructure.

Core Requirements:
• 2+ years experience building backend services in Java / Spring Boot or Go
• Proficiency with MySQL or PostgreSQL databases and transaction management
• Strong knowledge of Data Structures, Algorithms, and System Design principles
• Experience with Kafka message queues and Redis distributed caching

Nice to Have:
• Hands-on experience with Docker and Kubernetes deployment
• Active competitive programmer or high contest rating on LeetCode / Codeforces
• Bachelor's degree in Computer Science or Software Engineering`,
  },
];

export const JobPage: React.FC = () => {
  const [jobs, setJobs] = useState<JobDescriptionRecord[]>([]);
  const [selectedJob, setSelectedJob] = useState<JobDescriptionRecord | null>(null);
  const [matchReport, setMatchReport] = useState<JobMatchReport | null>(null);
  const [readinessReport, setReadinessReport] = useState<JobReadinessReport | null>(null);
  const [companyPrepReport, setCompanyPrepReport] = useState<CompanyPreparationReport | null>(null);

  const [loading, setLoading] = useState(false);
  const [matchingLoading, setMatchingLoading] = useState(false);
  const [readinessLoading, setReadinessLoading] = useState(false);
  const [companyPrepLoading, setCompanyPrepLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // View Mode: 'company_preparation' | 'readiness' | 'alignment'
  const [viewMode, setViewMode] = useState<'company_preparation' | 'readiness' | 'alignment'>('company_preparation');

  // Alignment Tabs
  const [alignmentTab, setAlignmentTab] = useState<'skills' | 'projects' | 'gaps' | 'keywords' | 'interview'>('skills');

  // Readiness What-If Simulation State
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>([]);

  // Form State
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [location, setLocation] = useState('');
  const [employmentType, setEmploymentType] = useState('Full-time');
  const [rawDescription, setRawDescription] = useState('');

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/jobs');
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs || []);
        if (data.jobs && data.jobs.length > 0 && !selectedJob) {
          selectJob(data.jobs[0]);
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectJob = async (job: JobDescriptionRecord) => {
    setSelectedJob(job);
    fetchJobDetails(job.id);
  };

  const fetchJobDetails = async (jobId: string) => {
    try {
      setMatchingLoading(true);
      setReadinessLoading(true);
      setCompanyPrepLoading(true);

      const [matchRes, readinessRes, companyPrepRes] = await Promise.all([
        fetch(`/api/jobs/${jobId}/match`),
        fetch(`/api/jobs/${jobId}/readiness`),
        fetch(`/api/jobs/${jobId}/company-preparation`),
      ]);

      if (matchRes.ok) {
        const matchData = await matchRes.json();
        setMatchReport(matchData);
      } else {
        setMatchReport(null);
      }

      if (readinessRes.ok) {
        const readinessData = await readinessRes.json();
        setReadinessReport(readinessData);
      } else {
        setReadinessReport(null);
      }

      if (companyPrepRes.ok) {
        const prepData = await companyPrepRes.json();
        setCompanyPrepReport(prepData);
      } else {
        setCompanyPrepReport(null);
      }
    } catch (err) {
      console.error('Failed to fetch job details:', err);
    } finally {
      setMatchingLoading(false);
      setReadinessLoading(false);
      setCompanyPrepLoading(false);
    }
  };

  const handleRefreshCompanyPreparation = async () => {
    if (!selectedJob) return;
    try {
      setCompanyPrepLoading(true);
      const res = await fetch(`/api/jobs/${selectedJob.id}/company-preparation/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company: selectedJob.company, title: selectedJob.title }),
      });
      if (res.ok) {
        const data = await res.json();
        setCompanyPrepReport(data);
      }
    } catch (err) {
      console.error('Failed to refresh company preparation:', err);
    } finally {
      setCompanyPrepLoading(false);
    }
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawDescription.trim()) {
      setError('Please provide job description text.');
      return;
    }

    try {
      setMatchingLoading(true);
      setError(null);
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title || 'Software Engineer',
          company: company || 'Tech Company',
          location: location || 'Remote',
          employmentType,
          rawDescription,
          autoMatch: true,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to analyze job description.');
      }

      const data = await res.json();
      await fetchJobs();

      if (data.job) {
        await selectJob(data.job);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setMatchingLoading(false);
    }
  };

  const handleRecalculateReadiness = async () => {
    if (!selectedJob) return;
    try {
      setReadinessLoading(true);
      const res = await fetch(`/api/jobs/${selectedJob.id}/readiness`, { method: 'POST' });
      if (res.ok) {
        const report = await res.json();
        setReadinessReport(report);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setReadinessLoading(false);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    try {
      const res = await fetch(`/api/jobs/${jobId}`, { method: 'DELETE' });
      if (res.ok) {
        setJobs(jobs.filter((j) => j.id !== jobId));
        if (selectedJob?.id === jobId) {
          setSelectedJob(null);
          setMatchReport(null);
          setReadinessReport(null);
        }
      }
    } catch (err: any) {
      console.error('Failed to delete job:', err);
    }
  };

  const applySampleJob = (sample: typeof SAMPLE_JOBS[0]) => {
    setTitle(sample.title);
    setCompany(sample.company);
    setLocation(sample.location);
    setEmploymentType(sample.employmentType);
    setRawDescription(sample.description);
  };

  const toggleScenario = (scenarioId: string) => {
    if (selectedScenarios.includes(scenarioId)) {
      setSelectedScenarios(selectedScenarios.filter((id) => id !== scenarioId));
    } else {
      setSelectedScenarios([...selectedScenarios, scenarioId]);
    }
  };

  const calculateSimulatedScore = () => {
    if (!readinessReport || !readinessReport.whatIfSimulation) return readinessReport?.score || 0;
    let base = readinessReport.score;
    selectedScenarios.forEach((scenId) => {
      const scen = readinessReport.whatIfSimulation?.find((s) => s.scenarioId === scenId);
      if (scen) {
        base += scen.estimatedDelta;
      }
    });
    return Math.min(100, base);
  };

  const getStateBadge = (state: JobMatchingState) => {
    switch (state) {
      case 'MATCHED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            MATCHED
          </span>
        );
      case 'PARTIALLY_MATCHED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-3.5 h-3.5" />
            PARTIALLY MATCHED
          </span>
        );
      case 'MISSING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="w-3.5 h-3.5" />
            NOT FOUND
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
            <HelpCircle className="w-3.5 h-3.5" />
            UNVERIFIABLE
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 font-mono text-xs uppercase tracking-wider mb-1">
            <Briefcase className="w-4 h-4" />
            NexusFlow Job Readiness Intelligence
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Job Readiness Score & Developer Alignment</h1>
          <p className="text-sm text-slate-400 mt-1">
            Evaluate your technical readiness for target software engineering roles backed by evidence across GitHub, LeetCode, Codeforces, Portfolio, and Resume.
          </p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Create Job Form */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl">
            <h2 className="text-base font-semibold text-white flex items-center gap-2 mb-4">
              <Plus className="w-4 h-4 text-indigo-400" />
              Analyze New Job Description
            </h2>

            {/* Sample Buttons */}
            <div className="mb-4">
              <label className="text-xs text-slate-400 mb-1.5 block font-medium">Quick Fill Sample Job:</label>
              <div className="flex flex-wrap gap-2">
                {SAMPLE_JOBS.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => applySampleJob(s)}
                    className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition border border-slate-700"
                  >
                    {s.title} ({s.company})
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleCreateJob} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1">Job Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Full Stack Engineer"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1">Company</label>
                  <input
                    type="text"
                    placeholder="e.g. NexusTech"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1">Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Remote / SF"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1">Type</label>
                  <select
                    value={employmentType}
                    onChange={(e) => setEmploymentType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Internship">Internship</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">Raw Job Description Text *</label>
                <textarea
                  rows={6}
                  placeholder="Paste complete job description requirements here..."
                  value={rawDescription}
                  onChange={(e) => setRawDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              {error && <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-lg">{error}</div>}

              <button
                type="submit"
                disabled={matchingLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold text-xs text-white transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 disabled:opacity-50"
              >
                {matchingLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {matchingLoading ? 'Analyzing Job Readiness...' : 'Evaluate Job Readiness'}
              </button>
            </form>
          </div>

          {/* Saved Jobs List */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl space-y-3">
            <h2 className="text-base font-semibold text-white flex items-center justify-between">
              <span>Saved Job Descriptions</span>
              <span className="text-xs font-normal text-slate-400">{jobs.length} jobs</span>
            </h2>

            {loading ? (
              <div className="text-xs text-slate-400 py-4 text-center">Loading jobs...</div>
            ) : jobs.length === 0 ? (
              <div className="text-xs text-slate-500 py-6 text-center italic">No job descriptions added yet. Use quick fill above.</div>
            ) : (
              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                {jobs.map((job) => {
                  const isSelected = selectedJob?.id === job.id;
                  return (
                    <div
                      key={job.id}
                      onClick={() => selectJob(job)}
                      className={`p-3.5 rounded-xl border transition cursor-pointer flex items-center justify-between group ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-500/10'
                          : 'border-slate-800 bg-slate-950 hover:border-slate-700 hover:bg-slate-900'
                      }`}
                    >
                      <div className="space-y-1 pr-2">
                        <div className="text-xs font-bold text-white group-hover:text-indigo-300 transition">{job.title || 'Software Engineer'}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-2">
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            {job.company || 'Tech Corp'}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {job.location || 'Remote'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteJob(job.id);
                          }}
                          className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-indigo-400' : 'text-slate-600'}`} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (8 Cols): Job Readiness & Matching Dashboard */}
        <div className="lg:col-span-8 space-y-6">
          {!selectedJob ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-12 text-center space-y-4">
              <Briefcase className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-lg font-semibold text-white">Select or Add a Job Description</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Paste a job description on the left to evaluate your deterministic Job Readiness Score and evidence-based requirement coverage.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Job Banner Header */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 mb-1">
                    <Building2 className="w-4 h-4" />
                    {selectedJob.company || 'Technology Employer'}
                  </div>
                  <h2 className="text-xl font-bold text-white tracking-tight">{selectedJob.title || 'Software Engineering Position'}</h2>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-2">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      {selectedJob.location || 'Remote'}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      {selectedJob.employmentType || 'Full-time'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleRecalculateReadiness}
                    disabled={readinessLoading}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 flex items-center gap-2 transition disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${readinessLoading ? 'animate-spin' : ''}`} />
                    Refresh Analysis
                  </button>
                </div>
              </div>

              {/* View Switcher: Company Preparation vs Readiness Intelligence vs Skill Alignment */}
              <div className="flex border-b border-slate-800 gap-4 overflow-x-auto">
                <button
                  onClick={() => setViewMode('company_preparation')}
                  className={`pb-3 px-1 text-sm font-bold flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
                    viewMode === 'company_preparation'
                      ? 'border-indigo-500 text-indigo-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  Company-Specific Preparation (Part 19)
                </button>
                <button
                  onClick={() => setViewMode('readiness')}
                  className={`pb-3 px-1 text-sm font-bold flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
                    viewMode === 'readiness'
                      ? 'border-indigo-500 text-indigo-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <BarChart2 className="w-4 h-4" />
                  Job Readiness Intelligence (Part 18)
                </button>
                <button
                  onClick={() => setViewMode('alignment')}
                  className={`pb-3 px-1 text-sm font-bold flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
                    viewMode === 'alignment'
                      ? 'border-indigo-500 text-indigo-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Target className="w-4 h-4" />
                  Job Description Alignment (Part 17)
                </button>
              </div>

              {/* VIEW MODE 0: COMPANY-SPECIFIC PREPARATION */}
              {viewMode === 'company_preparation' && (
                <div>
                  {companyPrepLoading ? (
                    <div className="p-12 text-center text-xs text-slate-400 flex flex-col items-center gap-3 bg-slate-900 rounded-2xl border border-slate-800">
                      <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
                      Generating Company-Specific Preparation Plan & Priority Engine Analysis...
                    </div>
                  ) : !companyPrepReport ? (
                    <div className="p-8 text-center text-xs text-slate-400 bg-slate-900 rounded-2xl border border-slate-800">
                      No preparation plan generated yet. Click "Refresh Plan" above.
                    </div>
                  ) : (
                    <CompanyPreparationView
                      report={companyPrepReport}
                      onRefresh={handleRefreshCompanyPreparation}
                      refreshLoading={companyPrepLoading}
                    />
                  )}
                </div>
              )}

              {/* VIEW MODE 1: JOB READINESS INTELLIGENCE */}
              {viewMode === 'readiness' && (
                <div className="space-y-6">
                  {readinessLoading ? (
                    <div className="p-12 text-center text-xs text-slate-400 flex flex-col items-center gap-3">
                      <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
                      Calculating evidence-based Job Readiness Score...
                    </div>
                  ) : !readinessReport ? (
                    <div className="p-8 text-center text-xs text-slate-400 bg-slate-900 rounded-2xl border border-slate-800">
                      No readiness report generated yet. Click "Refresh Analysis" above.
                    </div>
                  ) : (
                    <>
                      {/* Overall Job Readiness Score Card */}
                      <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-950 p-6 shadow-2xl relative overflow-hidden">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                          {/* Score Radial Display */}
                          <div className="md:col-span-5 flex flex-col items-center justify-center text-center p-4 rounded-xl bg-slate-950/80 border border-slate-800/80">
                            <div className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest mb-1">OVERALL READINESS</div>
                            <div className="text-5xl font-black text-white tracking-tight mb-1">
                              {readinessReport.score} <span className="text-lg text-slate-500 font-normal">/ 100</span>
                            </div>
                            <div className="mt-2">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${
                                  readinessReport.score >= 75
                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                    : readinessReport.score >= 60
                                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                    : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                }`}
                              >
                                {readinessReport.level.replace(/_/g, ' ')}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 mt-3 flex items-center gap-2">
                              <span>Confidence:</span>
                              <span className="font-bold text-white">{readinessReport.confidence}</span>
                              <span>•</span>
                              <span>DSA Relevance:</span>
                              <span className="font-bold text-indigo-300">{readinessReport.dsaRelevance}</span>
                            </div>
                          </div>

                          {/* Top Metrics Quick Overview */}
                          <div className="md:col-span-7 space-y-3">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-400">Technical Requirement Coverage</span>
                              <span className="font-bold text-white">{readinessReport.dimensions.technicalReadiness.score}%</span>
                            </div>
                            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-indigo-500 h-full rounded-full"
                                style={{ width: `${readinessReport.dimensions.technicalReadiness.score}%` }}
                              />
                            </div>

                            <div className="flex items-center justify-between text-xs pt-1">
                              <span className="text-slate-400">Project Architecture Evidence</span>
                              <span className="font-bold text-white">{readinessReport.dimensions.projectReadiness.score}%</span>
                            </div>
                            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-purple-500 h-full rounded-full"
                                style={{ width: `${readinessReport.dimensions.projectReadiness.score}%` }}
                              />
                            </div>

                            <div className="flex items-center justify-between text-xs pt-1">
                              <span className="text-slate-400">Interview Preparation Baseline</span>
                              <span className="font-bold text-white">{readinessReport.interviewReadinessScore}%</span>
                            </div>
                            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-emerald-500 h-full rounded-full"
                                style={{ width: `${readinessReport.interviewReadinessScore}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Executive Readiness Summary Card */}
                      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl space-y-3">
                        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-indigo-400" />
                          Executive Readiness Summary
                        </h3>
                        <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-line bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                          {readinessReport.executiveSummary}
                        </div>
                      </div>

                      {/* 8 Readiness Dimensions Breakdown Grid */}
                      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl space-y-4">
                        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                          <BarChart2 className="w-4 h-4 text-purple-400" />
                          8 Readiness Dimension Scores
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {Object.entries(readinessReport.dimensions).map(([key, dim]: [string, any]) => (
                            <div key={key} className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/70 space-y-2">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-white">{dim.label}</span>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] text-slate-500">Weight: {dim.weight}%</span>
                                  <span className="font-bold text-indigo-400 text-sm">{dim.score}%</span>
                                </div>
                              </div>

                              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    dim.score >= 75 ? 'bg-emerald-500' : dim.score >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                                  }`}
                                  style={{ width: `${dim.score}%` }}
                                />
                              </div>

                              <p className="text-[11px] text-slate-400 leading-tight">{dim.rationale}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Critical Gaps & Readiness Blockers */}
                      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl space-y-4">
                        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                          <AlertOctagon className="w-4 h-4 text-rose-400" />
                          Critical Technical Gaps & Blockers
                        </h3>

                        {readinessReport.criticalGaps.length === 0 ? (
                          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" />
                            No critical missing gaps detected for this role!
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {readinessReport.criticalGaps.map((gap, idx) => (
                              <div key={idx} className="p-4 rounded-xl border border-rose-500/20 bg-rose-950/10 space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-xs text-rose-300 flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                                    {gap.skillOrRequirement}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    {gap.isBlocker && (
                                      <span className="text-[10px] font-bold text-rose-400 px-2 py-0.5 rounded bg-rose-500/20 border border-rose-500/40 uppercase">
                                        Blocker
                                      </span>
                                    )}
                                    <span className="text-[10px] font-semibold text-amber-400 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                                      {gap.priority}
                                    </span>
                                  </div>
                                </div>

                                <div className="text-xs text-slate-300 grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                                  <div>
                                    <span className="text-slate-500 font-semibold block text-[10px] uppercase">Why Required:</span>
                                    <p>{gap.whyRequired}</p>
                                  </div>
                                  <div>
                                    <span className="text-slate-500 font-semibold block text-[10px] uppercase">What Is Missing:</span>
                                    <p>{gap.whatIsMissing}</p>
                                  </div>
                                </div>

                                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-indigo-300 mt-2">
                                  <span className="font-bold text-slate-200">Suggested Action:</span> {gap.suggestedAction}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Strong & Weak Signals Dual Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl space-y-3">
                          <h3 className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4" />
                            Strongest Signals
                          </h3>
                          <div className="space-y-2">
                            {readinessReport.strongSignals.map((sig, idx) => (
                              <div key={idx} className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-950/10 text-xs space-y-1">
                                <div className="font-bold text-white flex items-center justify-between">
                                  <span>{sig.title}</span>
                                  <span className="text-[10px] font-mono text-emerald-400 px-1.5 py-0.5 rounded bg-emerald-500/20">
                                    {sig.source}
                                  </span>
                                </div>
                                <p className="text-slate-300">{sig.description}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl space-y-3">
                          <h3 className="text-sm font-semibold text-rose-400 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            Weak Signals & Areas for Improvement
                          </h3>
                          <div className="space-y-2">
                            {readinessReport.weakSignals.map((sig, idx) => (
                              <div key={idx} className="p-3 rounded-xl border border-rose-500/20 bg-rose-950/10 text-xs space-y-1">
                                <div className="font-bold text-white flex items-center justify-between">
                                  <span>{sig.title}</span>
                                  <span className="text-[10px] font-mono text-rose-400 px-1.5 py-0.5 rounded bg-rose-500/20">
                                    {sig.source}
                                  </span>
                                </div>
                                <p className="text-slate-300">{sig.description}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Top 5 Preparation Priorities & Project Leverage */}
                      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl space-y-4">
                        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                          <Target className="w-4 h-4 text-indigo-400" />
                          Top Preparation Priorities & Project Leverage
                        </h3>

                        <div className="space-y-3">
                          {readinessReport.preparationPriorities.map((pri) => (
                            <div key={pri.rank} className="p-4 rounded-xl border border-slate-800 bg-slate-950/70 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-xs text-white flex items-center gap-2">
                                  <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-[10px] flex items-center justify-center font-mono">
                                    {pri.rank}
                                  </span>
                                  {pri.title}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono px-2 py-0.5 rounded bg-slate-800">
                                  Effort: {pri.estimatedEffort}
                                </span>
                              </div>
                              <p className="text-xs text-slate-300">{pri.description}</p>
                              <div className="text-xs text-indigo-300 font-medium pt-1">
                                <span className="text-slate-400">Action:</span> {pri.actionItem}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Existing Project Leverage */}
                        {readinessReport.projectLeverage.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-slate-800 space-y-3">
                            <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                              <Cpu className="w-3.5 h-3.5" />
                              Leverage Existing Projects
                            </h4>
                            {readinessReport.projectLeverage.map((proj, pIdx) => (
                              <div key={pIdx} className="p-3.5 rounded-xl border border-purple-500/20 bg-purple-950/10 text-xs space-y-1.5">
                                <div className="font-bold text-white flex items-center justify-between">
                                  <span>Repository: {proj.projectName}</span>
                                  <span className="text-[10px] text-purple-300">Extend with {proj.missingSkillToExtend}</span>
                                </div>
                                <p className="text-slate-300 leading-relaxed">{proj.recommendation}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* What-If Readiness Simulation Card */}
                      <div className="rounded-2xl border border-indigo-500/30 bg-slate-900/90 p-5 shadow-xl space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                            <Sliders className="w-4 h-4 text-indigo-400" />
                            Readiness Score Simulation (What-If Analysis)
                          </h3>
                          <div className="text-xs font-bold text-indigo-300 bg-indigo-500/20 px-3 py-1 rounded-full border border-indigo-500/30">
                            Simulated Score: {calculateSimulatedScore()} / 100
                          </div>
                        </div>

                        <p className="text-xs text-slate-400">
                          Select preparation actions below to simulate their deterministic score impact within NexusFlow's scoring engine.
                        </p>

                        <div className="space-y-2">
                          {readinessReport.whatIfSimulation?.map((scen) => {
                            const isSelected = selectedScenarios.includes(scen.scenarioId);
                            return (
                              <div
                                key={scen.scenarioId}
                                onClick={() => toggleScenario(scen.scenarioId)}
                                className={`p-3.5 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                                  isSelected
                                    ? 'border-indigo-500 bg-indigo-500/10 text-white'
                                    : 'border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-700'
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => {}}
                                    className="rounded border-slate-700 text-indigo-600 focus:ring-0"
                                  />
                                  <div>
                                    <div className="text-xs font-bold">{scen.name}</div>
                                    <div className="text-[11px] text-slate-400">{scen.actions.join(', ')}</div>
                                  </div>
                                </div>

                                <div className="text-xs font-bold text-emerald-400 bg-emerald-500/20 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                                  +{scen.estimatedDelta} pts
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <div className="text-[10px] text-slate-500 italic pt-1 text-right">
                          * Estimated score impact within NexusFlow's scoring model. Does not guarantee employment outcomes.
                        </div>
                      </div>

                      {/* Data Freshness Banner */}
                      <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3 font-mono text-[11px]">
                          <span>GitHub: {readinessReport.dataFreshness.github?.status || 'N/A'}</span>
                          <span>•</span>
                          <span>LeetCode: {readinessReport.dataFreshness.leetcode?.status || 'N/A'}</span>
                          <span>•</span>
                          <span>Codeforces: {readinessReport.dataFreshness.codeforces?.status || 'N/A'}</span>
                        </div>
                        <div className="text-[11px] text-indigo-300">{readinessReport.dataFreshness.overallNote}</div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* VIEW MODE 2: JOB DESCRIPTION ALIGNMENT (PART 17) */}
              {viewMode === 'alignment' && (
                <div className="space-y-6">
                  {!matchReport ? (
                    <div className="p-8 text-center text-xs text-slate-400 bg-slate-900 rounded-2xl border border-slate-800">
                      No alignment report found.
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Summary Banner */}
                      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl space-y-3">
                        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                          <Zap className="w-4 h-4 text-indigo-400" />
                          Overall Requirement Alignment: {matchReport.overallMatchScore}%
                        </h3>
                        <div className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                          {matchReport.summary}
                        </div>
                      </div>

                      {/* Navigation Tabs */}
                      <div className="flex border-b border-slate-800 gap-2">
                        {[
                          { id: 'skills', label: 'Skill Matches', icon: Target },
                          { id: 'projects', label: 'Project Relevance', icon: Layers },
                          { id: 'gaps', label: 'Skill Gap Analysis', icon: AlertTriangle },
                          { id: 'keywords', label: 'Keyword Alignment', icon: Code },
                          { id: 'interview', label: 'Prep Strategy', icon: Sparkles },
                        ].map((tab) => {
                          const Icon = tab.icon;
                          return (
                            <button
                              key={tab.id}
                              onClick={() => setAlignmentTab(tab.id as any)}
                              className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 text-xs font-semibold transition ${
                                alignmentTab === tab.id
                                  ? 'border-indigo-500 text-indigo-400'
                                  : 'border-transparent text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              <Icon className="w-3.5 h-3.5" />
                              {tab.label}
                            </button>
                          );
                        })}
                      </div>

                      {/* Tab 1: Detailed Skill Matching */}
                      {alignmentTab === 'skills' && (
                        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl space-y-4">
                          <h3 className="text-sm font-semibold text-white">Extracted Job Skills vs Verified Developer Profile</h3>
                          <div className="space-y-3">
                            {matchReport.skillMatches.map((skill, idx) => (
                              <div key={idx} className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-xs text-white">{skill.requirementName}</span>
                                    <span className="text-[10px] text-slate-400 px-2 py-0.5 rounded bg-slate-800">
                                      {skill.category}
                                    </span>
                                    <span className={`text-[10px] font-semibold ${skill.isRequired ? 'text-amber-400' : 'text-slate-400'}`}>
                                      {skill.isRequired ? 'Required' : 'Preferred'}
                                    </span>
                                  </div>
                                  <div>{getStateBadge(skill.state)}</div>
                                </div>

                                <p className="text-xs text-slate-300 leading-relaxed">{skill.reasoning}</p>

                                <div className="flex items-center gap-2 text-[10px] text-slate-400 pt-1">
                                  <span className="font-semibold text-slate-400">Evidence Sources:</span>
                                  {skill.evidenceSources.length > 0 ? (
                                    skill.evidenceSources.map((src, sIdx) => (
                                      <span key={sIdx} className="px-1.5 py-0.5 rounded bg-slate-800 text-indigo-300 font-mono">
                                        {src}
                                      </span>
                                    ))
                                  ) : (
                                    <span className="italic text-slate-500">None connected</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Tab 2: Project Relevance */}
                      {alignmentTab === 'projects' && (
                        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl space-y-4">
                          <h3 className="text-sm font-semibold text-white">Top Candidate Projects Ranked by Job Relevance</h3>
                          <div className="space-y-3">
                            {matchReport.projectRelevance.map((proj, idx) => (
                              <div key={idx} className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-xs text-white flex items-center gap-2">
                                    <Layers className="w-4 h-4 text-purple-400" />
                                    {proj.projectName}
                                  </span>
                                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                    {proj.relevanceScore}% Relevance
                                  </span>
                                </div>

                                <p className="text-xs text-slate-300">{proj.reasoning}</p>

                                {proj.technologyOverlap.length > 0 && (
                                  <div className="flex flex-wrap gap-1.5 pt-1">
                                    {proj.technologyOverlap.map((tech, tIdx) => (
                                      <span key={tIdx} className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[10px] font-medium">
                                        {tech}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Tab 3: Skill Gap Analysis */}
                      {alignmentTab === 'gaps' && (
                        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl space-y-4">
                          <h3 className="text-sm font-semibold text-white">Missing Skill Gaps & Actionable Learning Bridge</h3>
                          {matchReport.missingSkills.length === 0 ? (
                            <p className="text-xs text-emerald-400">No missing skill gaps detected!</p>
                          ) : (
                            <div className="space-y-3">
                              {matchReport.missingSkills.map((gap, idx) => (
                                <div key={idx} className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="font-bold text-xs text-rose-300 flex items-center gap-2">
                                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                                      {gap.skill} ({gap.category})
                                    </span>
                                    <span className="text-[10px] font-semibold text-amber-400 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                                      {gap.importance}
                                    </span>
                                  </div>

                                  <p className="text-xs text-slate-300 leading-relaxed">{gap.learningSuggestion}</p>

                                  {gap.transferrableSkills.length > 0 && (
                                    <div className="text-[11px] text-slate-400 pt-1">
                                      <span className="font-semibold text-slate-300">Transferable Skills:</span>{' '}
                                      {gap.transferrableSkills.join(', ')}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Tab 4: Keyword Alignment */}
                      {alignmentTab === 'keywords' && (
                        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl space-y-4">
                          <h3 className="text-sm font-semibold text-white">Job Keyword Coverage Matrix</h3>
                          <div className="flex flex-wrap gap-2">
                            {matchReport.keywordAlignment.map((kw, idx) => (
                              <span
                                key={idx}
                                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border ${
                                  kw.status === 'MATCHED'
                                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                                    : kw.status === 'MISSING_FROM_RESUME'
                                    ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                                    : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                                }`}
                              >
                                {kw.status === 'MATCHED' ? <Check className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                                {kw.keyword}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Tab 5: Prep Strategy */}
                      {alignmentTab === 'interview' && (
                        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl space-y-5">
                          <div>
                            <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                              <Sparkles className="w-4 h-4 text-indigo-400" />
                              Key Recommendations
                            </h3>
                            <ul className="space-y-2">
                              {matchReport.recommendations.map((rec, idx) => (
                                <li key={idx} className="text-xs text-slate-300 flex items-start gap-2 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                                  <span className="text-indigo-400 font-bold">•</span>
                                  {rec}
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div>
                            <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                              <Target className="w-4 h-4 text-purple-400" />
                              Interview Preparation Priorities
                            </h3>
                            <ul className="space-y-2">
                              {matchReport.interviewPriorities.map((item, idx) => (
                                <li key={idx} className="text-xs text-slate-300 flex items-start gap-2 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                                  <span className="text-purple-400 font-bold">•</span>
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobPage;

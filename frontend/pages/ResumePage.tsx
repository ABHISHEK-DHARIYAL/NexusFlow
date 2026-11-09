import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  FileText,
  FileCheck,
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Info,
  Sparkles,
  Zap,
  Target,
  Award,
  BookOpen,
  Briefcase,
  Code2,
  User,
  Copy,
  Check,
  ChevronRight,
  BarChart3,
  Flame,
  ArrowUpRight,
  ShieldCheck
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Resume, ResumeAnalysis } from '../types';
import { ResumeGitHubVerificationTab } from '../components/resume/ResumeGitHubVerificationTab';

const SAMPLE_RESUME_TEXT = `John Doe
Senior Software Engineer | Backend & Distributed Systems
San Francisco, CA | john.doe@example.com | (555) 019-2831 | github.com/johndoe | linkedin.com/in/johndoe

SUMMARY
Results-driven Senior Software Engineer with 5+ years of experience designing high-throughput microservices, real-time data pipelines, and cloud-native applications. Proficient in TypeScript, Node.js, Go, PostgreSQL, Redis, and Kubernetes.

WORK EXPERIENCE
Senior Backend Engineer | TechScale Cloud Corp
Jan 2022 – Present | San Francisco, CA
• Architected and deployed microservice event streaming pipeline using Go and Apache Kafka, processing 15M daily telemetry events with 99.99% uptime.
• Reduced API P99 latency by 42% across 12 core backend microservices by redesigning Redis caching layer and optimizing PostgreSQL queries.
• Spearheaded migration of legacy monolith to Docker and Kubernetes on AWS, cutting infrastructure deployment costs by $120,000 annually.
• Mentored team of 6 junior and mid-level engineers, enforcing strict CI/CD linting and automated unit test coverage (>85%).

Software Engineer | DevStream Systems
Jun 2019 – Dec 2021 | Austin, TX
• Developed high-concurrency WebSocket notification service using TypeScript and Node.js supporting 100,000+ simultaneous connections.
• Built automated CI/CD pipeline using GitHub Actions, decreasing release cycle times from 3 days to 20 minutes.
• Implemented OAuth2 and JWT authentication framework with role-based access control (RBAC) across 4 client applications.

EDUCATION
Bachelor of Science in Computer Science
University of California, Berkeley | 2015 – 2019 | GPA: 3.8/4.0

TECHNICAL SKILLS
• Programming Languages: TypeScript, JavaScript, Go, Python, Java, SQL
• Frameworks & Tools: Node.js, Express, React, PostgreSQL, Redis, Docker, Kubernetes, Kafka, AWS, Git, GraphQL, REST API
• Architecture & Concepts: Microservices, System Design, Concurrency, CI/CD, Unit Testing, Agility

PROJECTS
NexusFlow Developer Intelligence Engine
• Created full-stack developer portfolio intelligence platform with automated SSRF-safe crawling, AST static code analysis, and Gemini AI reports.
• Implemented Java multi-threaded worker engine for distributed code scan job scheduling.`;

export const ResumePage: React.FC = () => {
  const [resume, setResume] = useState<Resume | null>(null);
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [rawText, setRawText] = useState<string>('');
  const [mainMode, setMainMode] = useState<'ats' | 'github_verification'>('ats');
  const [activeTab, setActiveTab] = useState<'recommendations' | 'bullets' | 'keywords' | 'structure' | 'formatting'>('recommendations');
  const [copiedKeyword, setCopiedKeyword] = useState<string | null>(null);

  useEffect(() => {
    fetchResume();
  }, []);

  const fetchResume = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/resume');
      if (res.data.success && res.data.data) {
        setResume(res.data.data);
        if (res.data.data.analyses && res.data.data.analyses.length > 0) {
          setAnalysis(res.data.data.analyses[0]);
        }
        setRawText(res.data.data.rawText || '');
      }
    } catch (err) {
      // Resume not created yet
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (textToSubmit?: string) => {
    const content = textToSubmit || rawText;
    if (!content.trim() || content.trim().length < 50) return;

    try {
      setSubmitting(true);
      const res = await axios.post('/api/resume', {
        rawText: content,
        title: 'Developer Resume'
      });

      if (res.data.success) {
        // Poll for completed analysis
        setTimeout(() => {
          fetchResume();
        }, 2000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUseSample = () => {
    setRawText(SAMPLE_RESUME_TEXT);
    handleSubmit(SAMPLE_RESUME_TEXT);
  };

  const handleCopy = (kw: string) => {
    navigator.clipboard.writeText(kw);
    setCopiedKeyword(kw);
    setTimeout(() => setCopiedKeyword(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-100">
              {mainMode === 'ats' ? 'Resume Intelligence & ATS Optimization' : 'Resume ↔ GitHub Evidence Verification'}
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30">
              {mainMode === 'ats' ? 'PART 14' : 'PART 15'}
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            {mainMode === 'ats'
              ? 'AI-powered ATS resume parsing, bullet point impact evaluation (Google XYZ formula), keyword optimization, and recruiter readiness scoring.'
              : 'Cross-reference candidate resume claims against evidence in connected GitHub repositories to verify technologies, architecture, and project work.'}
          </p>
        </div>

        {resume && (
          <div className="flex items-center gap-3">
            <div className="p-1 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-1">
              <button
                onClick={() => setMainMode('ats')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                  mainMode === 'ats' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                ATS Intelligence
              </button>
              <button
                onClick={() => setMainMode('github_verification')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 ${
                  mainMode === 'github_verification' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>GitHub Verification</span>
              </button>
            </div>

            {mainMode === 'ats' && (
              <Button
                onClick={() => handleSubmit()}
                disabled={submitting}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${submitting ? 'animate-spin' : ''}`} />
                <span>Re-analyze Resume</span>
              </Button>
            )}
          </div>
        )}
      </div>

      {mainMode === 'github_verification' && resume ? (
        <ResumeGitHubVerificationTab resumeId={resume.id} />
      ) : !resume || !analysis ? (
        <Card className="p-8 space-y-6 border-dashed border-2 border-slate-800 bg-slate-900/50">
          <div className="text-center max-w-xl mx-auto space-y-3">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mx-auto">
              <FileCheck className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-100">Submit Your Resume for ATS Analysis</h2>
            <p className="text-xs text-slate-400">
              Paste your raw resume text, markdown, or use our sample high-impact developer resume template to get instant ATS scores and AI suggestions.
            </p>
          </div>

          <div className="space-y-3">
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Paste your resume raw text here (e.g., Contact Info, Work Experience, Skills, Education)..."
              className="w-full h-64 p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono focus:outline-none focus:border-blue-500/50 transition"
            />

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <Button
                onClick={handleUseSample}
                variant="outline"
                size="sm"
                className="w-full sm:w-auto flex items-center gap-2 border-slate-700 text-slate-300"
              >
                <Sparkles className="w-4 h-4 text-blue-400" />
                <span>Load Sample Senior Engineer Resume</span>
              </Button>

              <Button
                onClick={() => handleSubmit()}
                disabled={submitting || !rawText.trim()}
                size="sm"
                className="w-full sm:w-auto flex items-center gap-2"
              >
                {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                <span>Analyze Resume with ATS Engine</span>
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        /* ATS Results Dashboard */
        <div className="space-y-6">
          {/* Top Score Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card className="p-5 border-blue-500/30 bg-gradient-to-br from-blue-950/20 to-slate-900">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Overall ATS Score</span>
                <Target className="w-4 h-4 text-blue-400" />
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black text-blue-400">{analysis.atsScore}</span>
                <span className="text-xs text-slate-500">/ 100</span>
              </div>
              <div className="mt-2 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-blue-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${analysis.atsScore}%` }}
                />
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Formatting</span>
                <FileText className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black text-emerald-400">{analysis.formattingScore}</span>
                <span className="text-xs text-slate-500">/ 100</span>
              </div>
              <div className="mt-2 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${analysis.formattingScore}%` }}
                />
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Content Impact</span>
                <Flame className="w-4 h-4 text-amber-400" />
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black text-amber-400">{analysis.contentImpactScore}</span>
                <span className="text-xs text-slate-500">/ 100</span>
              </div>
              <div className="mt-2 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${analysis.contentImpactScore}%` }}
                />
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Skills Match</span>
                <Code2 className="w-4 h-4 text-purple-400" />
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black text-purple-400">{analysis.skillsMatchScore}</span>
                <span className="text-xs text-slate-500">/ 100</span>
              </div>
              <div className="mt-2 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-purple-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${analysis.skillsMatchScore}%` }}
                />
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Completeness</span>
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black text-cyan-400">{analysis.completenessScore}</span>
                <span className="text-xs text-slate-500">/ 100</span>
              </div>
              <div className="mt-2 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-cyan-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${analysis.completenessScore}%` }}
                />
              </div>
            </Card>
          </div>

          {/* Executive Summary Card */}
          <Card className="p-6 border-slate-800 bg-slate-900/60">
            <div className="flex items-center gap-2 mb-2 text-slate-100 font-semibold text-sm">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span>ATS Executive Summary</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {analysis.summary}
            </p>
          </Card>

          {/* Tabs Bar */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('recommendations')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'recommendations'
                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>ATS Action Plan ({analysis.actionableSuggestions?.length || 0})</span>
            </button>

            <button
              onClick={() => setActiveTab('bullets')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'bullets'
                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>Bullet Point Evaluator ({analysis.bulletEvaluations?.length || 0})</span>
            </button>

            <button
              onClick={() => setActiveTab('keywords')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'keywords'
                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Code2 className="w-3.5 h-3.5 text-purple-400" />
              <span>Missing Keywords ({analysis.missingKeywords?.length || 0})</span>
            </button>

            <button
              onClick={() => setActiveTab('structure')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'structure'
                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <User className="w-3.5 h-3.5 text-emerald-400" />
              <span>Parsed Resume Data</span>
            </button>

            <button
              onClick={() => setActiveTab('formatting')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'formatting'
                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Formatting Risks ({analysis.formattingIssues?.length || 0})</span>
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'recommendations' && (
            <div className="space-y-4">
              {analysis.actionableSuggestions?.map((item, idx) => (
                <Card key={idx} className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300">
                      {item.category}
                    </span>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.priority === 'HIGH'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          : item.priority === 'MEDIUM'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                      }`}
                    >
                      {item.priority} PRIORITY
                    </span>
                  </div>

                  <p className="text-sm font-semibold text-slate-100">{item.suggestion}</p>

                  <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 text-xs text-slate-400 flex items-start gap-2">
                    <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                    <span><strong className="text-slate-300">Recruiter Rationale:</strong> {item.impact}</span>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {activeTab === 'bullets' && (
            <div className="space-y-4">
              {analysis.bulletEvaluations?.map((bullet, idx) => (
                <Card key={idx} className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-400">Bullet #{idx + 1}</span>
                      {bullet.actionVerbUsed && (
                        <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          Action Verb
                        </span>
                      )}
                      {bullet.hasQuantifiableMetric && (
                        <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-blue-500/10 text-blue-400 border border-blue-500/30">
                          Metric Included
                        </span>
                      )}
                    </div>

                    <span className="text-xs font-bold text-amber-400">
                      Impact Score: {bullet.impactScore}/100
                    </span>
                  </div>

                  {/* Original Bullet */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                      Original Text
                    </span>
                    <p className="text-xs text-slate-300 p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono">
                      {bullet.original}
                    </p>
                  </div>

                  {/* Improved Rewrite */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
                        AI Recommended High-Impact Rewrite (Google XYZ Formula)
                      </span>
                    </div>
                    <p className="text-xs text-emerald-300 p-3 rounded-lg bg-emerald-950/30 border border-emerald-800/50 font-mono">
                      {bullet.improvedVersion}
                    </p>
                  </div>

                  <p className="text-[11px] text-slate-400 italic">
                    Feedback: {bullet.feedback}
                  </p>
                </Card>
              ))}
            </div>
          )}

          {activeTab === 'keywords' && (
            <Card className="p-6 space-y-4">
              <div>
                <h3 className="font-semibold text-slate-100 text-sm">Missing High-Impact Industry Keywords</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Adding these relevant technical keywords to your skills or experience sections will significantly improve automated ATS keyword screening filters.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                {analysis.missingKeywords?.map((kw, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleCopy(kw)}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-purple-500/50 text-xs font-mono text-purple-300 flex items-center gap-2 transition"
                  >
                    <span>{kw}</span>
                    {copiedKeyword === kw ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                    )}
                  </button>
                ))}
              </div>
            </Card>
          )}

          {activeTab === 'structure' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Contact Info Card */}
              <Card className="p-5 space-y-3">
                <div className="flex items-center gap-2 text-slate-100 font-semibold text-sm">
                  <User className="w-4 h-4 text-blue-400" />
                  <span>Contact Details</span>
                </div>
                <div className="space-y-2 text-xs text-slate-300">
                  <p><strong className="text-slate-400">Name:</strong> {resume.contactInfo?.name || 'N/A'}</p>
                  <p><strong className="text-slate-400">Email:</strong> {resume.contactInfo?.email || 'N/A'}</p>
                  <p><strong className="text-slate-400">Phone:</strong> {resume.contactInfo?.phone || 'N/A'}</p>
                  <p><strong className="text-slate-400">LinkedIn:</strong> {resume.contactInfo?.linkedin || 'N/A'}</p>
                  <p><strong className="text-slate-400">GitHub:</strong> {resume.contactInfo?.github || 'N/A'}</p>
                </div>
              </Card>

              {/* Skills Card */}
              <Card className="p-5 space-y-3">
                <div className="flex items-center gap-2 text-slate-100 font-semibold text-sm">
                  <Code2 className="w-4 h-4 text-purple-400" />
                  <span>Extracted Skills</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {resume.skills?.technical?.map((skill, i) => (
                    <span key={i} className="px-2.5 py-0.5 text-[11px] font-mono rounded bg-slate-800 text-slate-300">
                      {skill}
                    </span>
                  ))}
                </div>
              </Card>

              {/* Work Experience */}
              <Card className="p-5 md:col-span-2 space-y-4">
                <div className="flex items-center gap-2 text-slate-100 font-semibold text-sm">
                  <Briefcase className="w-4 h-4 text-amber-400" />
                  <span>Work Experience ({resume.workExperience?.length || 0})</span>
                </div>

                <div className="space-y-4">
                  {resume.workExperience?.map((exp, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-200 text-xs">{exp.company} — {exp.title}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{exp.dateRange}</span>
                      </div>
                      <ul className="list-disc list-inside space-y-1 text-xs text-slate-400">
                        {exp.highlights?.map((h, i) => (
                          <li key={i}>{h}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'formatting' && (
            <Card className="p-6 space-y-4">
              <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>Detected ATS Formatting & Structural Risks</span>
              </div>

              {analysis.formattingIssues?.length === 0 ? (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>No major ATS formatting defects or structural risks detected!</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {analysis.formattingIssues?.map((issue, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{issue}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* Edit / Update Raw Resume */}
          <Card className="p-6 space-y-4">
            <h3 className="font-semibold text-slate-100 text-sm">Update or Edit Resume Content</h3>
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              className="w-full h-48 p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono focus:outline-none focus:border-blue-500/50"
            />
            <Button
              onClick={() => handleSubmit()}
              disabled={submitting}
              size="sm"
              className="flex items-center gap-2"
            >
              {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              <span>Save & Re-run ATS Analysis</span>
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
};

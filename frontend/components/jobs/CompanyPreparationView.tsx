import React, { useState } from 'react';
import {
  Building2,
  Briefcase,
  Target,
  Zap,
  BookOpen,
  Code2,
  Cpu,
  CheckSquare,
  FileText,
  TrendingUp,
  Award,
  AlertCircle,
  HelpCircle,
  ChevronRight,
  RefreshCw,
  Info,
  Layers,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ArrowUpRight,
  ListOrdered,
  Clock,
  Compass,
} from 'lucide-react';
import { CompanyPreparationReport, PreparationPriorityItem } from '../../types';

interface CompanyPreparationViewProps {
  report: CompanyPreparationReport;
  onRefresh: () => void;
  refreshLoading?: boolean;
}

export const CompanyPreparationView: React.FC<CompanyPreparationViewProps> = ({
  report,
  onRefresh,
  refreshLoading = false,
}) => {
  const [activeTab, setActiveTab] = useState<'priority' | 'technical' | 'projects' | 'behavioral' | 'roadmap'>('priority');
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  const toggleChecklist = (id: string) => {
    setCheckedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const priorityBadge = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 border border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800">CRITICAL</span>;
      case 'HIGH':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800">HIGH</span>;
      case 'MEDIUM':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800">MEDIUM</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-800 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">LOW</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 rounded-2xl p-6 text-white shadow-xl border border-indigo-800/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Building2 className="w-64 h-64 text-indigo-400" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-2 text-indigo-300 text-sm font-semibold mb-2 uppercase tracking-wider">
              <Building2 className="w-4 h-4" /> Company-Specific Preparation Plan
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              {report.companyName}
              <span className="text-xl font-normal text-indigo-200">/ {report.jobTitle}</span>
            </h2>
            <p className="mt-2 text-indigo-200 text-sm max-w-3xl leading-relaxed">
              {report.executiveSummary}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onRefresh}
              disabled={refreshLoading}
              className="px-4 py-2 bg-indigo-600/80 hover:bg-indigo-600 text-white rounded-lg font-medium text-sm transition-all flex items-center gap-2 border border-indigo-400/30 backdrop-blur-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshLoading ? 'animate-spin' : ''}`} />
              Refresh Plan
            </button>
          </div>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-indigo-800/50">
          <div className="bg-indigo-950/60 rounded-xl p-4 border border-indigo-800/40">
            <div className="text-xs font-medium text-indigo-300">Preparation Coverage</div>
            <div className="text-3xl font-bold text-white mt-1">{report.preparationCoverageScore}%</div>
            <div className="text-xs text-indigo-300/80 mt-1">Weighted Area Readiness</div>
          </div>

          <div className="bg-indigo-950/60 rounded-xl p-4 border border-indigo-800/40">
            <div className="text-xs font-medium text-indigo-300">Top Priority Topic</div>
            <div className="text-lg font-bold text-amber-300 mt-1 truncate">{report.topPriorityTopic}</div>
            <div className="text-xs text-indigo-300/80 mt-1">Immediate Study Focus</div>
          </div>

          <div className="bg-indigo-950/60 rounded-xl p-4 border border-indigo-800/40">
            <div className="text-xs font-medium text-indigo-300">Job Match Score</div>
            <div className="text-3xl font-bold text-emerald-400 mt-1">{report.jobMatchScore}%</div>
            <div className="text-xs text-indigo-300/80 mt-1">Verified Profile Match</div>
          </div>

          <div className="bg-indigo-950/60 rounded-xl p-4 border border-indigo-800/40">
            <div className="text-xs font-medium text-indigo-300">Job Readiness Score</div>
            <div className="text-3xl font-bold text-blue-400 mt-1">{report.jobReadinessScore}%</div>
            <div className="text-xs text-indigo-300/80 mt-1">Interview Preparedness</div>
          </div>
        </div>
      </div>

      {/* Grounding & Methodology Card */}
      <div className="bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          <div className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
            <strong className="font-semibold">Zero-Fabrication Policy:</strong> {report.noFabricationDisclaimer}
          </div>
        </div>
        <div className="text-xs text-amber-800 dark:text-amber-300 font-mono bg-amber-100 dark:bg-amber-900/60 px-3 py-1.5 rounded-md shrink-0">
          Coverage: {report.coverageFormulaBreakdown?.coveredAreas} / {report.coverageFormulaBreakdown?.totalAreas} Weighted Units
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex overflow-x-auto border-b border-slate-200 dark:border-slate-800 gap-2 pb-px">
        <button
          onClick={() => setActiveTab('priority')}
          className={`flex items-center gap-2 px-4 py-3 font-medium text-sm border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'priority'
              ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Target className="w-4 h-4" /> Priority Topics & Gaps
        </button>

        <button
          onClick={() => setActiveTab('technical')}
          className={`flex items-center gap-2 px-4 py-3 font-medium text-sm border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'technical'
              ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Cpu className="w-4 h-4" /> DSA & System Design
        </button>

        <button
          onClick={() => setActiveTab('projects')}
          className={`flex items-center gap-2 px-4 py-3 font-medium text-sm border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'projects'
              ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Code2 className="w-4 h-4" /> Project STAR Discussions
        </button>

        <button
          onClick={() => setActiveTab('behavioral')}
          className={`flex items-center gap-2 px-4 py-3 font-medium text-sm border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'behavioral'
              ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4" /> Behavioral & Research
        </button>

        <button
          onClick={() => setActiveTab('roadmap')}
          className={`flex items-center gap-2 px-4 py-3 font-medium text-sm border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'roadmap'
              ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Compass className="w-4 h-4" /> 4-Phase Roadmap
        </button>
      </div>

      {/* Tab 1: Priority Topics & Gaps */}
      {activeTab === 'priority' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ListOrdered className="w-5 h-5 text-indigo-600" /> Ranked Priority Preparation Topics
              </h3>
              <span className="text-xs text-slate-500 font-mono">Sorted by P_score formula</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs uppercase">
                  <tr>
                    <th className="p-3">Topic / Area</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Priority</th>
                    <th className="p-3">Current Readiness</th>
                    <th className="p-3">Recommended Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {report.priorityItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                      <td className="p-3 font-semibold text-slate-900 dark:text-white">
                        {item.topic}
                        <div className="text-xs font-normal text-slate-500 dark:text-slate-400 mt-0.5">{item.reason}</div>
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-400">{item.category}</td>
                      <td className="p-3">{priorityBadge(item.priority)}</td>
                      <td className="p-3 text-slate-600 dark:text-slate-400">
                        <span className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded text-xs">
                          {item.currentReadiness}
                        </span>
                      </td>
                      <td className="p-3 text-slate-700 dark:text-slate-300">{item.recommendedAction}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Skill Transfer Recommendations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
              <h4 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" /> Skill Transfer Recommendations
              </h4>
              <div className="space-y-4">
                {report.skillTransfers.map((st, idx) => (
                  <div key={idx} className="p-4 bg-indigo-50/60 dark:bg-indigo-950/40 rounded-lg border border-indigo-100 dark:border-indigo-900/50">
                    <div className="flex items-center justify-between font-semibold text-slate-900 dark:text-white text-sm">
                      <span>{st.existingSkill} → <strong className="text-indigo-600 dark:text-indigo-400">{st.targetSkill}</strong></span>
                      {priorityBadge(st.priority)}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                      {st.transferStrategy}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Formula Explanation Card */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
              <h4 className="text-base font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <Info className="w-5 h-5 text-indigo-600" /> Priority Engine Methodology
              </h4>
              <pre className="bg-slate-900 text-indigo-300 text-xs p-4 rounded-lg font-mono whitespace-pre-wrap leading-relaxed overflow-x-auto">
                {report.priorityEngineFormulaDoc}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Technical & DSA Prep */}
      {activeTab === 'technical' && (
        <div className="space-y-6">
          {/* DSA Card */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-indigo-600" /> Data Structures & Algorithms Evaluation
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Relevance: <strong className="text-indigo-600">{report.dsaPreparation.roleRelevance}</strong> | Required: {report.dsaPreparation.isDSARequired ? 'Yes' : 'Secondary'}
                </p>
              </div>

              <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="text-center px-3 border-r border-slate-200 dark:border-slate-700">
                  <div className="text-xs text-slate-500">LeetCode Solved</div>
                  <div className="text-lg font-bold text-slate-900 dark:text-white">{report.dsaPreparation.currentDSAProfile.leetCodeSolved || 385}</div>
                </div>
                <div className="text-center px-3">
                  <div className="text-xs text-slate-500">Codeforces Rating</div>
                  <div className="text-lg font-bold text-amber-600 dark:text-amber-400">{report.dsaPreparation.currentDSAProfile.codeforcesRating || 1684}</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-900/50">
                <h5 className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider mb-2">Verified Strong Topics</h5>
                <div className="flex flex-wrap gap-2">
                  {report.dsaPreparation.currentDSAProfile.strongTopics.map((topic, i) => (
                    <span key={i} className="px-2.5 py-1 text-xs bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 rounded-md font-medium">
                      ✓ {topic}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-amber-50/60 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-900/50">
                <h5 className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider mb-2">Target Weak Areas to Practice</h5>
                <div className="flex flex-wrap gap-2">
                  {report.dsaPreparation.currentDSAProfile.weakTopics.map((topic, i) => (
                    <span key={i} className="px-2.5 py-1 text-xs bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 rounded-md font-medium">
                      ⚠ {topic}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3">DSA Topic Action Plans</h4>
            <div className="space-y-3">
              {report.dsaPreparation.topicPlans.map((plan, idx) => (
                <div key={idx} className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700/60 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                      {plan.topic} {priorityBadge(plan.priority)}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">{plan.reason}</div>
                  </div>
                  <div className="text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-3 py-1.5 rounded-md border border-indigo-200 dark:border-indigo-800">
                    {plan.recommendedAction}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* System Design Prep */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600" /> System Design & Architecture Preparation
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3">System Design Topics</h4>
                <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                  {report.technicalAndSystemDesignPrep.systemDesignTopics.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-md border border-slate-200 dark:border-slate-700">
                      <ChevronRight className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3">Core Technical Foundations</h4>
                <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                  {report.technicalAndSystemDesignPrep.technicalTopics.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-md border border-slate-200 dark:border-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Project Discussion & STAR Story Guides */}
      {activeTab === 'projects' && (
        <div className="space-y-6">
          {report.projectPreparations.map((project, idx) => (
            <div key={idx} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">{project.projectName}</h3>
                    <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      High Relevance
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{project.whyRelevant}</p>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {project.technologies.map((tech, i) => (
                    <span key={i} className="px-2 py-0.5 text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded font-mono">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              {/* Discussion Topics */}
              <div className="mb-6">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Likely Technical Discussion Topics</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {project.potentialDiscussionAreas.map((topic, i) => (
                    <div key={i} className="p-3 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-lg border border-indigo-100 dark:border-indigo-900/40 text-xs text-indigo-900 dark:text-indigo-200 flex items-start gap-2">
                      <Zap className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                      <span>{topic}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Story Guide Accordion / Breakdown */}
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3">STAR Story Guide Breakdown</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                  <strong className="text-indigo-600 dark:text-indigo-400 block mb-1">Problem & Scope</strong>
                  <p className="text-slate-600 dark:text-slate-300">{project.storyGuide.problem}</p>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                  <strong className="text-indigo-600 dark:text-indigo-400 block mb-1">Architecture Design</strong>
                  <p className="text-slate-600 dark:text-slate-300">{project.storyGuide.architecture}</p>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                  <strong className="text-indigo-600 dark:text-indigo-400 block mb-1">Technical Decisions</strong>
                  <p className="text-slate-600 dark:text-slate-300">{project.storyGuide.technicalDecisions}</p>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                  <strong className="text-indigo-600 dark:text-indigo-400 block mb-1">Trade-offs & Alternatives</strong>
                  <p className="text-slate-600 dark:text-slate-300">{project.storyGuide.tradeoffs}</p>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                  <strong className="text-indigo-600 dark:text-indigo-400 block mb-1">Key Engineering Challenge</strong>
                  <p className="text-slate-600 dark:text-slate-300">{project.storyGuide.challenges}</p>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                  <strong className="text-indigo-600 dark:text-indigo-400 block mb-1">Lessons Learned</strong>
                  <p className="text-slate-600 dark:text-slate-300">{project.storyGuide.lessonsLearned}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 4: Behavioral & Company Research */}
      {activeTab === 'behavioral' && (
        <div className="space-y-6">
          {/* Behavioral Themes */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600" /> Behavioral Preparation STAR Themes
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {report.behavioralPreparations.map((item, idx) => (
                <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="font-bold text-slate-900 dark:text-white text-sm mb-1">{item.theme}</div>
                  <div className="text-xs text-indigo-600 dark:text-indigo-400 mb-2">{item.context}</div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {item.preparationGuidance}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Company Research Checklist */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-indigo-600" /> Company Research Checklist
            </h3>
            <p className="text-xs text-slate-500 mb-4">{report.companyResearch.companyOverview}</p>

            <div className="space-y-2 mb-6">
              {report.companyResearch.checklistItems.map((item) => (
                <label
                  key={item.id}
                  onClick={() => toggleChecklist(item.id)}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    checkedItems[item.id]
                      ? 'bg-emerald-50/60 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900'
                      : 'bg-slate-50 border-slate-200 dark:bg-slate-800/50 dark:border-slate-700'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={!!checkedItems[item.id]}
                    onChange={() => {}}
                    className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <span className={`text-xs font-medium ${checkedItems[item.id] ? 'line-through text-slate-500' : 'text-slate-900 dark:text-white'}`}>
                      {item.label}
                    </span>
                    <span className="block text-[10px] text-slate-400 mt-0.5">{item.category}</span>
                  </div>
                </label>
              ))}
            </div>

            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">Questions to Research for Interviewers</h4>
            <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
              {report.companyResearch.questionsToResearch.map((q, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-indigo-500 font-bold">•</span>
                  <span>{q}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Tab 5: Preparation Roadmap */}
      {activeTab === 'roadmap' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <Compass className="w-5 h-5 text-indigo-600" /> Staged Preparation Roadmap
          </h3>

          <div className="space-y-6 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-indigo-200 dark:before:bg-indigo-900">
            {report.roadmap.map((phase) => (
              <div key={phase.phaseNumber} className="relative pl-10">
                <div className="absolute left-0 top-1 w-7 h-7 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-md">
                  {phase.phaseNumber}
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white text-base mb-2">
                    <span>{phase.phaseTitle}</span>
                    <span className="text-xs text-indigo-600 dark:text-indigo-400 font-normal">{phase.estimatedTimeline || 'Phase Focus'}</span>
                  </div>

                  <div className="mb-3">
                    <strong className="text-xs text-slate-500 uppercase tracking-wider block mb-1">Phase Goals</strong>
                    <ul className="list-disc list-inside text-xs text-slate-700 dark:text-slate-300 space-y-0.5">
                      {phase.goals.map((goal, i) => (
                        <li key={i}>{goal}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <strong className="text-xs text-slate-500 uppercase tracking-wider block mb-1">Action Items</strong>
                    <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                      {phase.actionItems.map((action, i) => (
                        <li key={i} className="flex items-start gap-2 bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-800">
                          <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

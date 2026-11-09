import React, { useState } from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useLeetCode } from '../hooks/useLeetCode';
import {
  Code2,
  Trophy,
  Target,
  TrendingUp,
  RefreshCw,
  Sparkles,
  Award,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ArrowUpRight,
  BookOpen,
  Compass,
  Check,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';

export const LeetCodePage: React.FC = () => {
  const { data, stats, contests, analysis, isLoading, isSyncing, error, connectProfile, syncProfile } = useLeetCode();
  const [inputUsername, setInputUsername] = useState<string>('');

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUsername.trim()) return;
    await connectProfile(inputUsername.trim());
  };

  const handleSync = async () => {
    await syncProfile();
  };

  const difficultyColors = {
    Easy: '#10B981', // emerald
    Medium: '#F59E0B', // amber
    Hard: '#EF4444', // red
  };

  const pieData = data?.profile
    ? [
        { name: 'Easy', value: data.profile.easySolved, color: difficultyColors.Easy },
        { name: 'Medium', value: data.profile.mediumSolved, color: difficultyColors.Medium },
        { name: 'Hard', value: data.profile.hardSolved, color: difficultyColors.Hard },
      ]
    : [];

  const contestLineData =
    contests?.contests.map((c) => ({
      name: c.contestName.replace('Weekly Contest ', 'WC ').replace('Biweekly Contest ', 'BWC '),
      rating: Math.round(c.rating),
      ranking: c.ranking,
      solved: c.problemsSolved,
    })) || [];

  const topicBarData =
    stats?.topicStats.slice(0, 8).map((t) => ({
      topic: t.topicName,
      solved: t.solvedCount,
      easy: t.easyCount,
      medium: t.mediumCount,
      hard: t.hardCount,
    })) || [];

  return (
    <PageContainer
      title="LeetCode Intelligence & Contest Analytics"
      description="Deterministic problem-solving analytics, DSA scoring, contest progression, and AI-driven career recommendations."
      action={
        data?.profile ? (
          <Button
            variant="outline"
            size="sm"
            onClick={handleSync}
            isLoading={isSyncing}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Sync LeetCode Data
          </Button>
        ) : undefined
      }
    >
      {/* Profile Connection Card if no profile exists */}
      {!data?.profile && (
        <Card className="p-6 bg-slate-900 border-amber-500/30 max-w-2xl mx-auto my-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
              <Code2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Connect LeetCode Profile</h2>
              <p className="text-xs text-slate-400">Enter your LeetCode username to initiate analysis.</p>
            </div>
          </div>

          <form onSubmit={handleConnect} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={inputUsername}
              onChange={(e) => setInputUsername(e.target.value)}
              placeholder="e.g. tourist, neetcode, alex_dev"
              className="flex-1 px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-amber-500/50"
            />
            <Button
              type="submit"
              isLoading={isSyncing}
              leftIcon={<Sparkles className="w-4 h-4 text-amber-400" />}
              className="bg-amber-600 hover:bg-amber-500 text-white font-semibold"
            >
              Connect & Analyze
            </Button>
          </form>

          {error && <p className="text-xs text-rose-400 mt-2">{error}</p>}
        </Card>
      )}

      {/* Main Dashboard View when Profile is connected */}
      {data?.profile && (
        <div className="space-y-6">
          {/* Top Summary Header Banner */}
          <Card className="p-5 bg-slate-900/90 border-slate-800">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-purple-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
                  <Code2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-lg font-bold text-slate-100">{data.profile.username}</h2>
                    {data.profile.realName && (
                      <span className="text-xs text-slate-400">({data.profile.realName})</span>
                    )}
                    <a
                      href={data.profile.profileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-amber-400 hover:underline flex items-center gap-0.5"
                    >
                      LeetCode Profile <ArrowUpRight className="w-3 h-3" />
                    </a>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Last synchronized: {new Date(data.profile.lastSyncedAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Username Input Switcher */}
              <form onSubmit={handleConnect} className="flex items-center gap-2">
                <input
                  type="text"
                  value={inputUsername}
                  onChange={(e) => setInputUsername(e.target.value)}
                  placeholder="Switch username..."
                  className="px-3 py-1.5 text-xs rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-amber-500/50"
                />
                <Button type="submit" size="sm" variant="outline" isLoading={isSyncing}>
                  Switch
                </Button>
              </form>
            </div>
          </Card>

          {/* 4 Stat Overview Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* DSA Score */}
            <Card className="p-4 bg-slate-900 border-amber-500/30 relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-400">Deterministic DSA Score</span>
                <Award className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-black text-amber-400">
                {data.metrics.dsaScore} <span className="text-xs text-slate-500 font-normal">/ 100</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Volume: 40% | Topics: 25% | Contests: 20% | Streak: 15%
              </p>
            </Card>

            {/* Total Solved */}
            <Card className="p-4 bg-slate-900 border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-400">Total Solved</span>
                <Target className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-slate-100">{data.profile.totalSolved}</div>
              <div className="flex items-center gap-2 mt-1.5 text-[11px]">
                <span className="text-emerald-400 font-medium">Easy: {data.profile.easySolved}</span>
                <span className="text-amber-400 font-medium">Med: {data.profile.mediumSolved}</span>
                <span className="text-rose-400 font-medium">Hard: {data.profile.hardSolved}</span>
              </div>
            </Card>

            {/* Contest Rating */}
            <Card className="p-4 bg-slate-900 border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-400">Contest Rating</span>
                <Trophy className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-2xl font-black text-purple-400">
                {Math.round(data.metrics.contestRating)}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Max Rating: <span className="text-purple-300 font-bold">{Math.round(data.metrics.maxRating)}</span> | Trend: {data.metrics.ratingTrend}
              </p>
            </Card>

            {/* Consistency & Streak */}
            <Card className="p-4 bg-slate-900 border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-400">Solving Streak</span>
                <Flame className="w-4 h-4 text-orange-400" />
              </div>
              <div className="text-2xl font-black text-orange-400">{data.profile.streak} Days</div>
              <p className="text-[11px] text-slate-400 mt-1">
                Consistency Rating: <span className="text-slate-200 font-semibold">{data.metrics.consistencyScore}/15</span>
              </p>
            </Card>
          </div>

          {/* Charts Row: Difficulty Pie + Topic Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Difficulty Breakdown Donut */}
            <Card className="p-5 bg-slate-900 border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-slate-100 text-sm">Difficulty Distribution</h3>
                  <p className="text-xs text-slate-400">Easy vs Medium vs Hard problem ratio</p>
                </div>
                <Target className="w-4 h-4 text-amber-400" />
              </div>

              <div className="h-60 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="flex justify-center gap-6 mt-2 text-xs font-semibold">
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  Easy ({data.profile.easySolved})
                </div>
                <div className="flex items-center gap-1.5 text-amber-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  Medium ({data.profile.mediumSolved})
                </div>
                <div className="flex items-center gap-1.5 text-rose-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                  Hard ({data.profile.hardSolved})
                </div>
              </div>
            </Card>

            {/* Contest Rating Progression */}
            <Card className="p-5 bg-slate-900 border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-slate-100 text-sm">Contest Rating Progression</h3>
                  <p className="text-xs text-slate-400">Time-series rating history and performance trend</p>
                </div>
                <TrendingUp className="w-4 h-4 text-purple-400" />
              </div>

              <div className="h-60 w-full">
                {contestLineData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={contestLineData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} />
                      <YAxis domain={['auto', 'auto']} stroke="#94a3b8" fontSize={10} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="rating"
                        stroke="#a855f7"
                        strokeWidth={3}
                        dot={{ r: 4, fill: '#a855f7' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-500">
                    No contest history recorded for this user.
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Topic Distribution Bar Chart */}
          <Card className="p-5 bg-slate-900 border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-100 text-sm">Top Topic Breakdown</h3>
                <p className="text-xs text-slate-400">Solved problem count across primary DSA topics</p>
              </div>
              <Zap className="w-4 h-4 text-blue-400" />
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topicBarData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="topic" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Bar dataKey="solved" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* AI Insights & Recommendations Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main AI Summary & Recommendations */}
            <div className="lg:col-span-2 space-y-6">
              {/* Summary Card */}
              <Card className="p-5 bg-slate-900 border-amber-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  <h3 className="font-bold text-slate-100 text-sm">Gemini AI Executive Summary</h3>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {analysis?.summary ||
                    `Analysis in progress for user ${data.profile.username}. Metrics evaluate a total of ${data.profile.totalSolved} solved problems with a DSA Score of ${data.metrics.dsaScore}/100.`}
                </p>
              </Card>

              {/* Strengths & Weaknesses */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-4 bg-slate-900 border-emerald-500/20">
                  <div className="flex items-center gap-2 mb-3 text-emerald-400 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Identified Technical Strengths</span>
                  </div>
                  <ul className="space-y-2">
                    {(analysis?.strengths || data.metrics.strongTopics).map((s, idx) => (
                      <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </Card>

                <Card className="p-4 bg-slate-900 border-rose-500/20">
                  <div className="flex items-center gap-2 mb-3 text-rose-400 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Growth & Weak Areas</span>
                  </div>
                  <ul className="space-y-2">
                    {(analysis?.weaknesses || data.metrics.weakTopics).map((w, idx) => (
                      <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                        <span>{w}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              </div>

              {/* Phased Learning Roadmap */}
              <Card className="p-5 bg-slate-900 border-slate-800">
                <div className="flex items-center gap-2 mb-4">
                  <Compass className="w-5 h-5 text-indigo-400" />
                  <h3 className="font-bold text-slate-100 text-sm">Phased Learning Roadmap</h3>
                </div>

                <div className="space-y-4">
                  {(analysis?.learningRoadmap || []).map((phaseItem, idx) => (
                    <div key={idx} className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-indigo-300">{phaseItem.phase}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
                          Phase {idx + 1}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mb-2">{phaseItem.focus}</p>
                      <div className="space-y-1">
                        {phaseItem.milestones.map((m, mIdx) => (
                          <div key={mIdx} className="flex items-center gap-2 text-xs text-slate-300">
                            <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                            <span>{m}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Sidebar: Recommendations & Contest Strategy */}
            <div className="space-y-6">
              {/* Prioritized Recommendations */}
              <Card className="p-5 bg-slate-900 border-slate-800">
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="w-4 h-4 text-amber-400" />
                  <h3 className="font-bold text-slate-100 text-xs">Actionable Practice Signals</h3>
                </div>
                <div className="space-y-2.5">
                  {(analysis?.recommendations || data.metrics.recommendationSignals).map((rec, idx) => (
                    <div key={idx} className="p-2.5 bg-slate-950 rounded border border-slate-800 text-xs text-slate-300 flex items-start gap-2">
                      <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Contest Execution Strategy */}
              <Card className="p-5 bg-slate-900 border-slate-800">
                <div className="flex items-center gap-2 mb-3">
                  <Trophy className="w-4 h-4 text-purple-400" />
                  <h3 className="font-bold text-slate-100 text-xs">Contest Execution Strategy</h3>
                </div>
                <div className="space-y-2">
                  {(analysis?.contestStrategy || [
                    'Scan all 4 problems during the first 2 minutes',
                    'Aim to solve Problem 1 & 2 within 25 minutes',
                    'Verify edge cases prior to submitting to avoid penalty deductions',
                  ]).map((strat, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                      <span className="text-purple-400 font-bold shrink-0">{idx + 1}.</span>
                      <span>{strat}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
};

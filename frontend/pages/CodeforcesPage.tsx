import React, { useState } from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useCodeforces } from '../hooks/useCodeforces';
import {
  Trophy,
  TrendingUp,
  RefreshCw,
  Sparkles,
  Award,
  Zap,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  BookOpen,
  Compass,
  Check,
  ExternalLink,
  Users,
  Building2,
  Calendar,
  Flame,
  Target
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Cell
} from 'recharts';

export const CodeforcesPage: React.FC = () => {
  const { profile, metrics, contests, analysis, isLoading, isSyncing, error, connectProfile, syncProfile } = useCodeforces();
  const [inputHandle, setInputHandle] = useState<string>('');

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputHandle.trim()) return;
    await connectProfile(inputHandle.trim());
  };

  const handleSync = async () => {
    await syncProfile();
  };

  // Recharts rating progression data
  const contestChartData = contests.map((c) => ({
    name: c.contestName.replace('Codeforces Round #', 'CR #').replace(' (Div. ', ' D'),
    rating: c.ratingAfter,
    change: c.ratingChange,
    rank: c.rank,
    date: new Date(c.contestDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  }));

  // Recharts difficulty distribution data
  const difficultyData = metrics?.difficultyDistribution
    ? Object.entries(metrics.difficultyDistribution).map(([range, count]) => ({
        range,
        count
      }))
    : [];

  const difficultyBarColors = ['#38bdf8', '#34d399', '#facc15', '#fb923c', '#f87171', '#c084fc'];

  return (
    <PageContainer
      title="Codeforces Intelligence"
      description="Competitive programming analytics, contest history, rating trends, and AI-powered recommendations."
    >
      {/* Header Actions & Profile Connection */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        {profile ? (
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold text-lg">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-100">{profile.handle}</h2>
                <a
                  href={profile.profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 capitalize">
                  {profile.rank || 'Unrated'}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-400 mt-0.5">
                {profile.organization && (
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-slate-500" />
                    {profile.organization}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-slate-500" />
                  {profile.friendOfCount} friends
                </span>
                <span>Contribution: {profile.contribution}</span>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <h2 className="text-xl font-bold text-slate-100">Connect Codeforces Account</h2>
            <p className="text-xs text-slate-400">Analyze official contest ratings, tags, and problem ratings.</p>
          </div>
        )}

        {profile && (
          <Button
            onClick={handleSync}
            disabled={isSyncing}
            isLoading={isSyncing}
            leftIcon={<RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />}
            className="self-start sm:self-auto"
          >
            {isSyncing ? 'Synchronizing...' : 'Sync Data'}
          </Button>
        )}
      </div>

      {/* Connection Form if no profile */}
      {!profile && !isLoading && (
        <Card className="p-8 max-w-xl mx-auto my-8 border-cyan-500/20 bg-slate-900/90 text-center">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mx-auto mb-4">
            <Trophy className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-100 mb-2">Connect Codeforces Handle</h3>
          <p className="text-xs text-slate-400 mb-6">
            Enter your official Codeforces handle (e.g., <code className="text-cyan-400">tourist</code> or <code className="text-cyan-400">nexusflow_test</code>) to fetch contest history and compute competitive programming metrics.
          </p>

          <form onSubmit={handleConnect} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Enter Codeforces Handle"
              value={inputHandle}
              onChange={(e) => setInputHandle(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500 transition-colors"
            />
            <Button type="submit" disabled={isSyncing || !inputHandle.trim()} isLoading={isSyncing}>
              Connect
            </Button>
          </form>

          {error && <p className="text-xs text-rose-400 mt-3">{error}</p>}
        </Card>
      )}

      {/* Main Profile Metrics Grid */}
      {profile && metrics && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
            {/* CP Score */}
            <Card className="p-5 bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900 border-indigo-500/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-indigo-400" />
                  Competitive Programming Score
                </span>
                <span className="text-2xl font-extrabold text-indigo-400">{metrics.cpScore}</span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden mb-2">
                <div className="bg-gradient-to-r from-indigo-500 to-cyan-400 h-full" style={{ width: `${metrics.cpScore}%` }} />
              </div>
              <p className="text-[11px] text-slate-400">
                Deterministic score based on rating, problem difficulty, and consistency.
              </p>
            </Card>

            {/* Current & Max Rating */}
            <Card className="p-5 bg-slate-900 border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-cyan-400" />
                  Codeforces Rating
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 capitalize">
                  {profile.rank || 'Unrated'}
                </span>
              </div>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-2xl font-bold text-slate-100">{metrics.currentRating}</span>
                <span className="text-xs text-slate-400">(Max: {metrics.maxRating})</span>
              </div>
              <p className="text-[11px] text-slate-400 capitalize">
                Peak Rank: {profile.maxRank || profile.rank || 'Unrated'}
              </p>
            </Card>

            {/* Rating Trend & Contests */}
            <Card className="p-5 bg-slate-900 border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  Rating Trend
                </span>
                <span className="text-xs font-bold text-emerald-400">{metrics.ratingTrend}</span>
              </div>
              <div className="text-2xl font-bold text-slate-100 mb-1">{metrics.contestCount}</div>
              <p className="text-[11px] text-slate-400">Total rated contests participated</p>
            </Card>

            {/* Total Problems & Consistency */}
            <Card className="p-5 bg-slate-900 border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-amber-400" />
                  Consistency Score
                </span>
                <span className="text-2xl font-bold text-amber-400">{metrics.consistencyScore}</span>
              </div>
              <div className="text-sm font-medium text-slate-200 mb-1">{metrics.totalProblemsSolved} Solved Problems</div>
              <p className="text-[11px] text-slate-400">Based on recent submission velocity</p>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Rating Progression Line Chart */}
            <Card className="p-5">
              <h3 className="text-sm font-bold text-slate-100 mb-1 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                Contest Rating Progression
              </h3>
              <p className="text-xs text-slate-400 mb-4">Historical official rating change per contest</p>

              {contestChartData.length > 0 ? (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={contestChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={11} domain={['dataMin - 50', 'dataMax + 50']} tickLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
                        formatter={(val: any, name: string) => [val, name === 'rating' ? 'Rating' : name]}
                      />
                      <Line type="monotone" dataKey="rating" stroke="#38bdf8" strokeWidth={2.5} dot={{ fill: '#38bdf8', r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-xs text-slate-500 py-12 text-center">No official contest history available.</p>
              )}
            </Card>

            {/* Problem Difficulty Distribution Bar Chart */}
            <Card className="p-5">
              <h3 className="text-sm font-bold text-slate-100 mb-1 flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-400" />
                Problem Difficulty Distribution
              </h3>
              <p className="text-xs text-slate-400 mb-4">Solved problems categorized by Codeforces problem rating</p>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={difficultyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                    <XAxis dataKey="range" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {difficultyData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={difficultyBarColors[index % difficultyBarColors.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* Topic / Tag Strengths */}
          <Card className="p-5 mb-6">
            <h3 className="text-sm font-bold text-slate-100 mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              Topic Strengths & Focus Areas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-emerald-950/20 border border-emerald-500/20 rounded-lg">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 mb-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Strong Topics
                </span>
                <div className="flex flex-wrap gap-2">
                  {metrics.strongTags.length > 0 ? (
                    metrics.strongTags.map((tag) => (
                      <span key={tag} className="px-2.5 py-1 text-xs font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 rounded-md capitalize">
                        {tag}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-500">Solve more problems to identify strong topics.</span>
                  )}
                </div>
              </div>

              <div className="p-4 bg-rose-950/20 border border-rose-500/20 rounded-lg">
                <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5 mb-2">
                  <AlertTriangle className="w-4 h-4" />
                  Growth Opportunities (Weak Topics)
                </span>
                <div className="flex flex-wrap gap-2">
                  {metrics.weakTags.length > 0 ? (
                    metrics.weakTags.map((tag) => (
                      <span key={tag} className="px-2.5 py-1 text-xs font-medium bg-rose-500/10 text-rose-300 border border-rose-500/30 rounded-md capitalize">
                        {tag}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-500">No major weakness tags identified.</span>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Gemini AI Intelligence Report */}
          {analysis && (
            <Card className="p-6 mb-6 border-cyan-500/30 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-800">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-slate-100">Gemini Competitive Programming Analysis</h3>
              </div>

              {/* Summary */}
              <p className="text-sm text-slate-300 leading-relaxed mb-6 bg-slate-950/60 p-4 rounded-lg border border-slate-800">
                {analysis.summary}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Strengths */}
                <div>
                  <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Check className="w-4 h-4" /> Key Strengths
                  </h4>
                  <ul className="space-y-2">
                    {analysis.strengths.map((str, idx) => (
                      <li key={idx} className="text-xs text-slate-300 flex items-start gap-2 bg-slate-950/40 p-2.5 rounded border border-slate-800/60">
                        <span className="text-emerald-400 font-bold">•</span>
                        <span>{str}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Recommendations */}
                <div>
                  <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <ArrowUpRight className="w-4 h-4" /> Strategic Recommendations
                  </h4>
                  <ul className="space-y-2">
                    {analysis.recommendations.map((rec, idx) => (
                      <li key={idx} className="text-xs text-slate-300 flex items-start gap-2 bg-slate-950/40 p-2.5 rounded border border-slate-800/60">
                        <span className="text-cyan-400 font-bold">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Learning Roadmap */}
              {analysis.learningRoadmap && analysis.learningRoadmap.length > 0 && (
                <div className="mt-6 pt-4 border-t border-slate-800">
                  <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Compass className="w-4 h-4" /> Personalized Practice Roadmap
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {analysis.learningRoadmap.map((road, idx) => (
                      <div key={idx} className="p-3.5 bg-slate-950/60 rounded-lg border border-slate-800/80">
                        <div className="text-xs font-bold text-cyan-300 mb-1">{road.phase}</div>
                        <div className="text-xs font-medium text-slate-300 mb-2">{road.focus}</div>
                        <ul className="space-y-1">
                          {road.milestones.map((m, mIdx) => (
                            <li key={mIdx} className="text-[11px] text-slate-400 flex items-center gap-1.5">
                              <span className="w-1 h-1 rounded-full bg-cyan-400" />
                              <span>{m}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Contest History Table */}
          <Card className="p-5">
            <h3 className="text-sm font-bold text-slate-100 mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-cyan-400" />
              Contest History ({contests.length})
            </h3>

            {contests.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="p-3">Contest Name</th>
                      <th className="p-3">Rank</th>
                      <th className="p-3">Rating Before</th>
                      <th className="p-3">Rating After</th>
                      <th className="p-3">Change</th>
                      <th className="p-3">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {contests.map((c) => (
                      <tr key={c.id || c.contestId} className="hover:bg-slate-800/30 transition-colors">
                        <td className="p-3 font-semibold text-slate-200">{c.contestName}</td>
                        <td className="p-3 text-slate-400">#{c.rank}</td>
                        <td className="p-3 text-slate-400">{c.ratingBefore}</td>
                        <td className="p-3 font-medium text-slate-200">{c.ratingAfter}</td>
                        <td className="p-3 font-bold">
                          <span className={c.ratingChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                            {c.ratingChange >= 0 ? `+${c.ratingChange}` : c.ratingChange}
                          </span>
                        </td>
                        <td className="p-3 text-slate-400">
                          {new Date(c.contestDate).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-6 text-center">No contest history recorded.</p>
            )}
          </Card>
        </>
      )}
    </PageContainer>
  );
};

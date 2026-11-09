import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { useLeetCode } from '../../hooks/useLeetCode';
import { Code2, TrendingUp, Trophy, Target, ArrowRight, Loader2, Award } from 'lucide-react';

export const LeetCodeDashboardCard: React.FC = () => {
  const navigate = useNavigate();
  const { data, isLoading } = useLeetCode();

  if (isLoading) {
    return (
      <Card className="p-5 flex items-center justify-center min-h-[160px]">
        <div className="flex items-center gap-3 text-slate-400 text-xs">
          <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
          <span>Loading LeetCode Intelligence metrics...</span>
        </div>
      </Card>
    );
  }

  if (!data?.profile) {
    return (
      <Card className="p-5 bg-slate-900 border-amber-500/20">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Code2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-sm">LeetCode Intelligence</h3>
              <p className="text-xs text-slate-400">Connect profile for problem-solving & contest analysis</p>
            </div>
          </div>
          <Button size="sm" onClick={() => navigate('/leetcode')} rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
            Connect LeetCode
          </Button>
        </div>
      </Card>
    );
  }

  const { profile, metrics } = data;
  const strongestTopic = metrics.strongTopics[0] || 'Arrays';
  const weakestTopic = metrics.weakTopics[0] || 'Dynamic Programming';

  return (
    <Card className="p-5 bg-slate-900 border-slate-800 hover:border-slate-700 transition-all">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
            <Code2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-100 text-sm">{profile.username}</h3>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                LeetCode Profile
              </span>
            </div>
            <p className="text-xs text-slate-400">Competitive Programming & DSA Metrics</p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/leetcode')}
          rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
        >
          View Full Analytics
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {/* DSA Score */}
        <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>DSA Score</span>
          </div>
          <div className="text-lg font-bold text-amber-400">
            {metrics.dsaScore} <span className="text-xs text-slate-500 font-normal">/ 100</span>
          </div>
        </div>

        {/* Problems Solved */}
        <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
            <Target className="w-3.5 h-3.5 text-emerald-400" />
            <span>Problems Solved</span>
          </div>
          <div className="text-lg font-bold text-slate-100">{profile.totalSolved}</div>
          <p className="text-[10px] text-slate-500 truncate">
            E:{profile.easySolved} M:{profile.mediumSolved} H:{profile.hardSolved}
          </p>
        </div>

        {/* Contest Rating */}
        <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
            <Trophy className="w-3.5 h-3.5 text-purple-400" />
            <span>Contest Rating</span>
          </div>
          <div className="text-lg font-bold text-purple-400">{Math.round(metrics.contestRating)}</div>
          <p className="text-[10px] text-slate-500 truncate">Max: {Math.round(metrics.maxRating)}</p>
        </div>

        {/* Strongest Topic */}
        <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
          <div className="text-xs text-slate-400 mb-1 truncate">Strongest Topic</div>
          <div className="text-xs font-bold text-emerald-400 truncate">{strongestTopic}</div>
          <p className="text-[10px] text-slate-500">High Mastery</p>
        </div>

        {/* Weakest Topic */}
        <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
          <div className="text-xs text-slate-400 mb-1 truncate">Weakest Topic</div>
          <div className="text-xs font-bold text-rose-400 truncate">{weakestTopic}</div>
          <p className="text-[10px] text-slate-500">Focus Target</p>
        </div>

        {/* Rating Trend */}
        <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
            <span>Rating Trend</span>
          </div>
          <div className="text-xs font-bold text-blue-400 truncate">
            {metrics.ratingTrend === 'IMPROVING' ? '↑ Improving' : metrics.ratingTrend}
          </div>
          <p className="text-[10px] text-slate-500">{metrics.streak}d streak</p>
        </div>
      </div>
    </Card>
  );
};

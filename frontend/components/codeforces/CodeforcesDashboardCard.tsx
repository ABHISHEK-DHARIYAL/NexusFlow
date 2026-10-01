import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { useCodeforces } from '../../hooks/useCodeforces';
import { Trophy, TrendingUp, Target, ArrowRight, Loader2, Award, Zap } from 'lucide-react';

export const CodeforcesDashboardCard: React.FC = () => {
  const navigate = useNavigate();
  const { profile, metrics, isLoading } = useCodeforces();

  if (isLoading) {
    return (
      <Card className="p-5 flex items-center justify-center min-h-[160px]">
        <div className="flex items-center gap-3 text-slate-400 text-xs">
          <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
          <span>Loading Codeforces Intelligence metrics...</span>
        </div>
      </Card>
    );
  }

  if (!profile) {
    return (
      <Card className="p-5 bg-slate-900 border-cyan-500/20">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-sm">Codeforces Intelligence</h3>
              <p className="text-xs text-slate-400">Connect profile for contest analytics & rating tracking</p>
            </div>
          </div>
          <Button size="sm" onClick={() => navigate('/codeforces')} rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
            Connect Codeforces
          </Button>
        </div>
      </Card>
    );
  }

  const rating = profile.rating ?? 0;
  const maxRating = profile.maxRating ?? rating;
  const rank = profile.rank || 'Unrated';
  const cpScore = metrics?.cpScore ?? profile.cpScore ?? 0;
  const ratingTrend = metrics?.ratingTrend || 'STABLE';
  const contestCount = metrics?.contestCount ?? 0;
  const strongestTag = metrics?.strongTags?.[0] || 'Greedy';
  const weakestTag = metrics?.weakTags?.[0] || 'Dynamic Programming';

  return (
    <Card className="p-5 bg-slate-900 border-slate-800 hover:border-slate-700 transition-all">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-100 text-sm">{profile.handle}</h3>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 capitalize">
                {rank}
              </span>
            </div>
            <p className="text-xs text-slate-400">Competitive Programming Profile</p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/codeforces')}
          rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
        >
          View Analytics
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Rating */}
        <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
            <Trophy className="w-3.5 h-3.5 text-cyan-400" />
            <span>Rating / Max</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold text-slate-100">{rating}</span>
            <span className="text-xs text-slate-400">/ {maxRating}</span>
          </div>
        </div>

        {/* CP Score */}
        <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
            <Award className="w-3.5 h-3.5 text-indigo-400" />
            <span>CP Score</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-bold text-indigo-400">{cpScore}</span>
            <span className="text-xs text-slate-400">/ 100</span>
          </div>
        </div>

        {/* Trend */}
        <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span>Trend ({contestCount} Contests)</span>
          </div>
          <div className="text-sm font-semibold text-emerald-400 flex items-center gap-1">
            {ratingTrend === 'IMPROVING' ? '↑ Improving' : ratingTrend === 'DECLINING' ? '↓ Declining' : '→ Stable'}
          </div>
        </div>

        {/* Strong/Weak Tag */}
        <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Top / Gap Tag</span>
          </div>
          <div className="text-xs font-medium text-slate-200 truncate">
            <span className="text-emerald-400 font-semibold">{strongestTag}</span>
            <span className="text-slate-500 mx-1">/</span>
            <span className="text-rose-400">{weakestTag}</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

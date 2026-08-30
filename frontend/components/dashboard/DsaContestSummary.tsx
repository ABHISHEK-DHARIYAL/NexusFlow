import React from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useNavigate } from 'react-router-dom';
import { Code2, Trophy, ArrowRight, ExternalLink } from 'lucide-react';

interface DsaContestSummaryProps {
  leetcode: any;
  codeforces: any;
}

export const DsaContestSummary: React.FC<DsaContestSummaryProps> = ({ leetcode, codeforces }) => {
  const navigate = useNavigate();

  return (
    <Card className="bg-slate-900 border-slate-800 p-6 space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Code2 className="w-5 h-5 text-blue-400" />
          <h2 className="text-base font-bold text-slate-100">Competitive Programming & DSA Intelligence</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => navigate('/leetcode')}
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            LeetCode
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => navigate('/codeforces')}
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            Codeforces
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* LeetCode Panel */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                LC
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-100">LeetCode Profile</h3>
                <p className="text-[10px] text-slate-400 font-mono">@{leetcode?.username || 'Not Connected'}</p>
              </div>
            </div>
            <Badge variant="amber" className="text-xs font-bold">DSA Score: {leetcode?.dsaScore || 0}/100</Badge>
          </div>

          {leetcode ? (
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-4 gap-2 text-center bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 block font-mono">SOLVED</span>
                  <span className="font-extrabold text-slate-100 text-sm">{leetcode.solved.total}</span>
                </div>
                <div>
                  <span className="text-[10px] text-emerald-400 block font-mono">EASY</span>
                  <span className="font-extrabold text-emerald-300 text-sm">{leetcode.solved.easy}</span>
                </div>
                <div>
                  <span className="text-[10px] text-amber-400 block font-mono">MEDIUM</span>
                  <span className="font-extrabold text-amber-300 text-sm">{leetcode.solved.medium}</span>
                </div>
                <div>
                  <span className="text-[10px] text-red-400 block font-mono">HARD</span>
                  <span className="font-extrabold text-red-300 text-sm">{leetcode.solved.hard}</span>
                </div>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 font-semibold block mb-1">Strong Topics:</span>
                <div className="flex flex-wrap gap-1">
                  {leetcode.strongTopics.map((t: string, i: number) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-300 border border-emerald-800/50 text-[10px]">
                      ✓ {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500 py-4 text-center">Connect LeetCode profile to view problem breakdown.</p>
          )}
        </div>

        {/* Codeforces Panel */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">
                CF
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-100">Codeforces Profile</h3>
                <p className="text-[10px] text-slate-400 font-mono">@{codeforces?.handle || 'Not Connected'}</p>
              </div>
            </div>
            <Badge variant="blue" className="text-xs font-bold">CP Score: {codeforces?.cpScore || 0}/100</Badge>
          </div>

          {codeforces ? (
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-2 text-center bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 block font-mono">RATING</span>
                  <span className="font-extrabold text-blue-400 text-sm">{codeforces.rating || 'Unrated'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-mono">RANK</span>
                  <span className="font-extrabold text-purple-300 text-sm capitalize">{codeforces.rank || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-mono">CONTESTS</span>
                  <span className="font-extrabold text-slate-100 text-sm">{codeforces.contestCount || 0}</span>
                </div>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 font-semibold block mb-1">Strong Tags:</span>
                <div className="flex flex-wrap gap-1">
                  {codeforces.strongTags.map((t: string, i: number) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-blue-950/40 text-blue-300 border border-blue-800/50 text-[10px]">
                      ✓ {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500 py-4 text-center">Connect Codeforces handle to view contest rating.</p>
          )}
        </div>
      </div>
    </Card>
  );
};

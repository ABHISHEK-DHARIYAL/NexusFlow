import React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { CheckCircle2, Clock, AlertTriangle, ShieldCheck, Sparkles, RefreshCw } from 'lucide-react';

interface ProfileHeaderBannerProps {
  user: {
    name: string;
    username: string;
    avatarUrl?: string;
  };
  completeness: {
    score: number;
    connectedCount: number;
    totalSources: number;
    label: string;
    sources: Record<string, boolean>;
  };
  freshness: Record<string, { status: 'FRESH' | 'STALE' | 'UNAVAILABLE'; lastSyncedAt?: string }>;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export const ProfileHeaderBanner: React.FC<ProfileHeaderBannerProps> = ({
  user,
  completeness,
  freshness,
  onRefresh,
  isRefreshing,
}) => {
  return (
    <Card className="bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-950 border-slate-800 p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* User Avatar & Info */}
        <div className="flex items-center gap-4">
          <img
            src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
            alt={user.name}
            className="w-16 h-16 rounded-2xl border-2 border-blue-500/40 object-cover shadow-lg shrink-0"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-100 tracking-tight">{user.name}</h1>
              <ShieldCheck className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-xs text-slate-400 font-mono">@{user.username} • Unified Developer Profile</p>
            <p className="text-xs text-blue-400 font-medium mt-1 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> {completeness.label}
            </p>
          </div>
        </div>

        {/* Profile Completeness Gauge */}
        <div className="flex flex-col md:items-end justify-center gap-2 shrink-0 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 min-w-[240px]">
          <div className="flex items-center justify-between w-full text-xs font-semibold">
            <span className="text-slate-400">Profile Integration</span>
            <span className="text-blue-400 font-mono font-bold">{completeness.score}%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-500 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${completeness.score}%` }}
            />
          </div>
          <span className="text-[11px] text-slate-500">
            {completeness.connectedCount} of {completeness.totalSources} sources connected
          </span>
        </div>
      </div>

      {/* Freshness Status Chips */}
      <div className="pt-4 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400 font-medium mr-1">Data Sources:</span>
          {Object.entries(freshness).map(([src, info]) => {
            const isFresh = info.status === 'FRESH';
            const isStale = info.status === 'STALE';
            return (
              <span
                key={src}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border capitalize ${
                  isFresh
                    ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/50'
                    : isStale
                    ? 'bg-amber-950/40 text-amber-300 border-amber-800/50'
                    : 'bg-slate-800/60 text-slate-400 border-slate-700/60'
                }`}
              >
                {isFresh ? (
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                ) : isStale ? (
                  <Clock className="w-3 h-3 text-amber-400" />
                ) : (
                  <AlertTriangle className="w-3 h-3 text-slate-500" />
                )}
                {src}
                <span className="text-[9px] opacity-75 font-mono">({info.status})</span>
              </span>
            );
          })}
        </div>

        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-semibold cursor-pointer transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-400' : ''}`} />
          {isRefreshing ? 'Syncing...' : 'Sync All Data'}
        </button>
      </div>
    </Card>
  );
};

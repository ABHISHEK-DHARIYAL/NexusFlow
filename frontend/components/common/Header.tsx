import React from 'react';
import {
  Bell,
  Cpu,
  Search,
  CheckCircle2,
  Github,
  Zap,
  Sparkles
} from 'lucide-react';
import { User, Notification } from '../../types';

interface HeaderProps {
  user: User;
  notifications: Notification[];
  unreadCount: number;
  onOpenNotifications: () => void;
  activeTab: string;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  unreadCount,
  onOpenNotifications,
  activeTab,
}) => {
  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-800 bg-slate-900/90 px-6 backdrop-blur-md">
      {/* Title & Page Context */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            System Live
          </span>
        </div>
        <div className="h-4 w-[1px] bg-slate-800" />
        <h1 className="text-sm font-semibold capitalize text-slate-200">
          {activeTab.replace('-', ' ')}
        </h1>
      </div>

      {/* Global Search & Worker Quick Status */}
      <div className="flex items-center gap-4">
        <div className="relative hidden md:block w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search repos, tasks, findings..."
            className="w-full rounded-lg border border-slate-800 bg-slate-950/60 py-1.5 pl-9 pr-4 text-xs text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Java Concurrency Worker Badge */}
        <div className="hidden lg:flex items-center gap-2 rounded-lg border border-indigo-500/30 bg-indigo-950/40 px-3 py-1.5 text-xs text-indigo-300">
          <Cpu className="h-3.5 w-3.5 text-indigo-400 animate-spin" style={{ animationDuration: '6s' }} />
          <span>Java 21 ThreadPool:</span>
          <span className="font-semibold text-emerald-400">4 Core / 16 Max</span>
        </div>

        {/* Gemini AI Status Badge */}
        <div className="hidden sm:flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-950/30 px-3 py-1.5 text-xs text-amber-300">
          <Sparkles className="h-3.5 w-3.5 text-amber-400" />
          <span>Gemini 3.6 Flash</span>
        </div>

        {/* Notification Bell */}
        <button
          onClick={onOpenNotifications}
          className="relative rounded-lg border border-slate-800 bg-slate-950/60 p-2 text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
          title="Notifications"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
              {unreadCount}
            </span>
          )}
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-3 border-l border-slate-800 pl-4">
          <img
            src={user.avatarUrl}
            alt={user.name}
            className="h-8 w-8 rounded-full border border-indigo-500/40 object-cover"
          />
          <div className="hidden text-left xl:block">
            <div className="text-xs font-medium text-slate-200">{user.name}</div>
            <div className="text-[10px] text-slate-400">@{user.username} • {user.role}</div>
          </div>
        </div>
      </div>
    </header>
  );
};

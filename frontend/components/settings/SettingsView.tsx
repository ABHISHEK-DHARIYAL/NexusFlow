import React from 'react';
import { Settings, Shield, Key, Database, Server, Github, CheckCircle2 } from 'lucide-react';
import { User } from '../../types';

interface SettingsViewProps {
  user: User;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ user }) => {
  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Settings className="h-5 w-5 text-indigo-400" />
          Settings & Environment Configuration
        </h2>
        <p className="text-xs text-slate-400">
          Environment variables, security credentials, and platform integration options
        </p>
      </div>

      {/* User Profile Settings Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Shield className="h-4 w-4 text-emerald-400" /> Account & Role Profile
        </h3>
        <div className="flex items-center gap-4">
          <img
            src={user.avatarUrl}
            alt={user.name}
            className="h-12 w-12 rounded-full border border-indigo-500/40"
          />
          <div>
            <div className="text-sm font-bold text-slate-200">{user.name}</div>
            <div className="text-xs text-slate-400">@{user.username} • {user.email}</div>
            <div className="mt-1 inline-block rounded bg-indigo-500/20 px-2 py-0.5 text-[10px] font-bold text-indigo-300">
              ROLE: {user.role}
            </div>
          </div>
        </div>
      </div>

      {/* Environment Variables Reference Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Key className="h-4 w-4 text-indigo-400" /> Local & Cloud Environment Variable Map
        </h3>

        <div className="space-y-2 font-mono text-xs">
          <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-3">
            <span className="text-indigo-300">DATABASE_URL</span>
            <span className="text-slate-400">mysql://root:****@localhost:3306/nexusflow</span>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-3">
            <span className="text-indigo-300">JWT_SECRET</span>
            <span className="text-emerald-400 font-bold">CONFIGURED (HMAC-SHA256)</span>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-3">
            <span className="text-indigo-300">GEMINI_API_KEY</span>
            <span className="text-amber-400 font-bold">INJECTED AT RUNTIME</span>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-3">
            <span className="text-indigo-300">JAVA_SERVICE_URL</span>
            <span className="text-slate-400">http://localhost:8080</span>
          </div>
        </div>
      </div>
    </div>
  );
};

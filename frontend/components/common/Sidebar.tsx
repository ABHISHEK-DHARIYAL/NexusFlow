import React from 'react';
import {
  LayoutDashboard,
  FolderGit2,
  ListTodo,
  Cpu,
  FileSpreadsheet,
  BookOpenCheck,
  Settings,
  Zap,
  Github,
  ShieldCheck
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  pendingTaskCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  pendingTaskCount,
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'repositories', label: 'Repositories', icon: FolderGit2 },
    {
      id: 'tasks',
      label: 'Task Queue',
      icon: ListTodo,
      badge: pendingTaskCount > 0 ? pendingTaskCount : undefined,
    },
    { id: 'workers', label: 'Java Worker Engine', icon: Cpu },
    { id: 'reports', label: 'AI Health Reports', icon: FileSpreadsheet },
    { id: 'architecture', label: 'System Architecture', icon: BookOpenCheck },
    { id: 'settings', label: 'Settings & Config', icon: Settings },
  ];

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-slate-800 bg-slate-900/95 text-slate-300">
      {/* Brand Header */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-800 px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-400 p-0.5 shadow-lg shadow-indigo-500/20">
          <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-slate-950">
            <Zap className="h-5 w-5 text-emerald-400 fill-emerald-400/20" />
          </div>
        </div>
        <div>
          <span className="text-base font-bold tracking-tight text-white">
            Nexus<span className="text-emerald-400">Flow</span>
          </span>
          <span className="block text-[10px] uppercase tracking-widest text-slate-500">
            Developer Intelligence
          </span>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 space-y-1.5 px-3 py-6">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`group flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-medium transition-all ${
                isActive
                  ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 shadow-sm'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`h-4 w-4 transition-colors ${
                    isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-[10px] font-semibold text-indigo-300 border border-indigo-500/40">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* System Footer Card */}
      <div className="p-4 border-t border-slate-800/80">
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="flex items-center gap-1.5 font-medium text-slate-300">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              Railway Multi-Service
            </span>
            <span className="text-[10px] text-emerald-400 font-mono">ONLINE</span>
          </div>
          <p className="text-[10px] text-slate-500 leading-relaxed">
            MySQL • Node.js Express • Java 21 Concurrency Engine • Gemini 3.6 Flash
          </p>
        </div>
      </div>
    </aside>
  );
};

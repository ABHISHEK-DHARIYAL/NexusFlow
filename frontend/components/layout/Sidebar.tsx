import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  GitBranch,
  FileText,
  ListTodo,
  Cpu,
  History,
  Bell,
  Settings as SettingsIcon,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  ShieldCheck,
  Code2,
  Trophy,
  Globe,
  FileCheck,
  Briefcase,
  Bot,
  Building2,
  Clock,
} from 'lucide-react';
import { useNotificationStore } from '../../store/useNotificationStore';

export interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggleCollapse }) => {
  const location = useLocation();
  const { unreadCount } = useNotificationStore();

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { path: '/repositories', label: 'Repositories', icon: <GitBranch className="w-5 h-5" /> },
    { path: '/leetcode', label: 'LeetCode Analytics', icon: <Code2 className="w-5 h-5" /> },
    { path: '/codeforces', label: 'Codeforces Analytics', icon: <Trophy className="w-5 h-5" /> },
    { path: '/portfolio', label: 'Portfolio Intelligence', icon: <Globe className="w-5 h-5" /> },
    { path: '/resume', label: 'Resume Intelligence', icon: <FileCheck className="w-5 h-5" /> },
    { path: '/verification', label: 'Developer Verification', icon: <ShieldCheck className="w-5 h-5" /> },
    { path: '/jobs', label: 'Job Intelligence', icon: <Briefcase className="w-5 h-5" /> },
    { path: '/applications', label: 'Job Tracker', icon: <Building2 className="w-5 h-5" /> },
    { path: '/career', label: 'Career + Interview Coach', icon: <Bot className="w-5 h-5" /> },
    { path: '/automations', label: 'Automations', icon: <Clock className="w-5 h-5" /> },
    { path: '/analysis/reports', label: 'AI Reports', icon: <FileText className="w-5 h-5" /> },
    { path: '/queue', label: 'Queue Monitor', icon: <ListTodo className="w-5 h-5" /> },
    { path: '/workers', label: 'Workers', icon: <Cpu className="w-5 h-5" /> },
    { path: '/executions', label: 'Execution History', icon: <History className="w-5 h-5" /> },
    {
      path: '/notifications',
      label: 'Notifications',
      icon: <Bell className="w-5 h-5" />,
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    { path: '/settings', label: 'Settings', icon: <SettingsIcon className="w-5 h-5" /> },
  ];

  return (
    <aside
      className={`relative hidden md:flex flex-col bg-slate-900 border-r border-slate-800 transition-all duration-300 z-30 ${
        isCollapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-800 h-16 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-md">
          N
        </div>
        {!isCollapsed && (
          <div className="flex flex-col overflow-hidden">
            <span className="font-bold text-slate-100 text-sm tracking-tight truncate">NexusFlow</span>
            <span className="text-[10px] text-blue-400 font-mono tracking-wider">DEV PLATFORM</span>
          </div>
        )}
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-2.5 py-4 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all group ${
                isActive
                  ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-transparent'
              }`}
            >
              <div className={isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-200'}>
                {item.icon}
              </div>
              {!isCollapsed && <span className="flex-1 truncate">{item.label}</span>}
              {!isCollapsed && item.badge !== undefined && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-blue-500 text-white">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <div className="p-3 border-t border-slate-800 flex justify-end">
        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
};

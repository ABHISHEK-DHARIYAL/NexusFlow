import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  GitBranch,
  FileText,
  ListTodo,
  Cpu,
  Bell,
  Settings,
} from 'lucide-react';
import { Drawer } from '../ui/Drawer';
import { useNotificationStore } from '../../store/useNotificationStore';

export interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ isOpen, onClose }) => {
  const { unreadCount } = useNotificationStore();

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { path: '/repositories', label: 'Repositories', icon: <GitBranch className="w-5 h-5" /> },
    { path: '/analysis/reports', label: 'AI Reports', icon: <FileText className="w-5 h-5" /> },
    { path: '/queue', label: 'Queue Monitor', icon: <ListTodo className="w-5 h-5" /> },
    { path: '/workers', label: 'Workers', icon: <Cpu className="w-5 h-5" /> },
    {
      path: '/notifications',
      label: 'Notifications',
      icon: <Bell className="w-5 h-5" />,
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    { path: '/settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="NexusFlow Navigation" position="left">
      <nav className="space-y-1 py-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-3 rounded-lg text-sm font-semibold transition-colors ${
                isActive
                  ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`
            }
          >
            {item.icon}
            <span className="flex-1">{item.label}</span>
            {item.badge !== undefined && (
              <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-blue-500 text-white">
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>
    </Drawer>
  );
};

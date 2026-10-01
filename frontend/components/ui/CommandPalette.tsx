import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  LayoutDashboard,
  GitBranch,
  FileText,
  ListTodo,
  Cpu,
  Settings as SettingsIcon,
  Moon,
  Sun,
  LogOut,
} from 'lucide-react';
import { useThemeStore } from '../../store/useThemeStore';
import { useAuthStore } from '../../store/useAuthStore';

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const { theme, setTheme } = useThemeStore();
  const { logout } = useAuthStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else onClose(); // parent handles toggle
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const actions = [
    {
      id: 'dash',
      label: 'Go to Dashboard',
      icon: <LayoutDashboard className="w-4 h-4 text-blue-400" />,
      perform: () => navigate('/dashboard'),
    },
    {
      id: 'repos',
      label: 'Go to Repositories',
      icon: <GitBranch className="w-4 h-4 text-indigo-400" />,
      perform: () => navigate('/repositories'),
    },
    {
      id: 'reports',
      label: 'Go to AI Reports',
      icon: <FileText className="w-4 h-4 text-purple-400" />,
      perform: () => navigate('/analysis/reports'),
    },
    {
      id: 'queue',
      label: 'Go to Queue Monitor',
      icon: <ListTodo className="w-4 h-4 text-amber-400" />,
      perform: () => navigate('/queue'),
    },
    {
      id: 'workers',
      label: 'Go to Workers Dashboard',
      icon: <Cpu className="w-4 h-4 text-emerald-400" />,
      perform: () => navigate('/workers'),
    },
    {
      id: 'settings',
      label: 'Go to Settings',
      icon: <SettingsIcon className="w-4 h-4 text-slate-400" />,
      perform: () => navigate('/settings'),
    },
    {
      id: 'theme',
      label: `Toggle Theme (Current: ${theme})`,
      icon: theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-400" />,
      perform: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
    },
    {
      id: 'logout',
      label: 'Sign Out (Placeholder)',
      icon: <LogOut className="w-4 h-4 text-rose-400" />,
      perform: () => {
        logout();
        navigate('/login');
      },
    },
  ];

  const filtered = actions.filter((a) => a.label.toLowerCase().includes(query.toLowerCase()));

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
        />
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: -10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: -10 }}
          className="relative z-10 w-full max-w-xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden"
        >
          <div className="flex items-center px-4 border-b border-slate-800">
            <Search className="w-5 h-5 text-slate-400 shrink-0" />
            <input
              autoFocus
              type="text"
              placeholder="Type a command or search..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-transparent px-3 py-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
            />
            <kbd className="px-2 py-0.5 text-[10px] font-semibold text-slate-400 bg-slate-800 border border-slate-700 rounded">
              ESC
            </kbd>
          </div>
          <div className="p-2 max-h-80 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500">No matching commands</div>
            ) : (
              filtered.map((action) => (
                <button
                  key={action.id}
                  onClick={() => {
                    action.perform();
                    onClose();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-medium text-slate-200 rounded-lg hover:bg-slate-800 hover:text-white transition-colors cursor-pointer text-left"
                >
                  {action.icon}
                  <span className="flex-1">{action.label}</span>
                </button>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

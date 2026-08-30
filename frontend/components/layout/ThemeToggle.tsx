import React from 'react';
import { Sun, Moon, Laptop } from 'lucide-react';
import { useThemeStore } from '../../store/useThemeStore';
import { Dropdown } from '../ui/Dropdown';

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useThemeStore();

  const iconMap = {
    dark: <Moon className="w-4 h-4 text-blue-400" />,
    light: <Sun className="w-4 h-4 text-amber-400" />,
    system: <Laptop className="w-4 h-4 text-slate-400" />,
  };

  const items = [
    { id: 'dark', label: 'Dark Mode', icon: <Moon className="w-4 h-4 text-blue-400" />, onClick: () => setTheme('dark') },
    { id: 'light', label: 'Light Mode', icon: <Sun className="w-4 h-4 text-amber-400" />, onClick: () => setTheme('light') },
    { id: 'system', label: 'System Mode', icon: <Laptop className="w-4 h-4 text-slate-400" />, onClick: () => setTheme('system') },
  ];

  return (
    <Dropdown
      align="right"
      trigger={
        <div className="p-2 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer">
          {iconMap[theme]}
        </div>
      }
      items={items}
    />
  );
};

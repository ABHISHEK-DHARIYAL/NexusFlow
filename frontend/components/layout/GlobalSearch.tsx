import React from 'react';
import { Search } from 'lucide-react';

export interface GlobalSearchProps {
  onOpenCommandPalette: () => void;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ onOpenCommandPalette }) => {
  return (
    <button
      onClick={onOpenCommandPalette}
      className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-colors w-48 sm:w-64 cursor-pointer text-xs"
    >
      <Search className="w-3.5 h-3.5 shrink-0" />
      <span className="flex-1 text-left truncate">Search repositories, tasks...</span>
      <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-800 border border-slate-700 rounded">
        <span>⌘</span>K
      </kbd>
    </button>
  );
};

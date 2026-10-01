import React, { useState } from 'react';
import { Menu } from 'lucide-react';
import { Breadcrumbs } from './Breadcrumbs';
import { GlobalSearch } from './GlobalSearch';
import { ThemeToggle } from './ThemeToggle';
import { NotificationButton } from './NotificationButton';
import { UserMenu } from './UserMenu';
import { MobileNav } from './MobileNav';

export interface TopNavProps {
  onOpenCommandPalette: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({ onOpenCommandPalette }) => {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  return (
    <header className="h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-4 flex items-center justify-between sticky top-0 z-20 shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsMobileNavOpen(true)}
          className="md:hidden p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>
        <Breadcrumbs />
      </div>

      <div className="flex items-center gap-3">
        <GlobalSearch onOpenCommandPalette={onOpenCommandPalette} />
        <NotificationButton />
        <ThemeToggle />
        <UserMenu />
      </div>

      <MobileNav isOpen={isMobileNavOpen} onClose={() => setIsMobileNavOpen(false)} />
    </header>
  );
};

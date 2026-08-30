import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'blue' | 'purple' | 'emerald' | 'amber' | 'rose' | 'slate' | 'cyan';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'blue', size = 'md', className = '' }) => {
  const variantStyles = {
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    slate: 'bg-slate-800 text-slate-300 border-slate-700',
    cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[10px] font-semibold',
    md: 'px-2.5 py-1 text-xs font-medium',
  };

  return (
    <span className={`inline-flex items-center rounded-md border ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}>
      {children}
    </span>
  );
};

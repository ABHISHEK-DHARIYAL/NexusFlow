import React from 'react';

export interface ProgressProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'blue' | 'emerald' | 'amber' | 'rose' | 'indigo';
  showValue?: boolean;
}

export const Progress: React.FC<ProgressProps> = ({
  value,
  max = 100,
  size = 'md',
  variant = 'blue',
  showValue = false,
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const heightStyles = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  const variantStyles = {
    blue: 'bg-blue-500',
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
    indigo: 'bg-indigo-500',
  };

  return (
    <div className="w-full flex items-center gap-3">
      <div className={`w-full bg-slate-800 rounded-full overflow-hidden ${heightStyles[size]}`}>
        <div
          className={`h-full transition-all duration-300 rounded-full ${variantStyles[variant]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showValue && <span className="text-xs font-semibold text-slate-300 min-w-[32px]">{Math.round(percentage)}%</span>}
    </div>
  );
};

import React from 'react';

export interface SeparatorProps {
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

export const Separator: React.FC<SeparatorProps> = ({ orientation = 'horizontal', className = '' }) => {
  return (
    <div
      className={`bg-slate-800 shrink-0 ${
        orientation === 'horizontal' ? 'h-px w-full' : 'w-px h-full min-h-[16px]'
      } ${className}`}
    />
  );
};

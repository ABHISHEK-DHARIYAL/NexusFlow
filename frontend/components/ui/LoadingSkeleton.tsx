import React from 'react';

export interface LoadingSkeletonProps {
  className?: string;
  count?: number;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ className = 'h-4 w-full', count = 1 }) => {
  return (
    <div className="flex flex-col gap-2 w-full">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`animate-pulse bg-slate-800/80 rounded-lg ${className}`} />
      ))}
    </div>
  );
};

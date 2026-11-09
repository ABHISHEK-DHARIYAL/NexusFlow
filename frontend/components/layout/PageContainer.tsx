import React from 'react';

export interface PageContainerProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const PageContainer: React.FC<PageContainerProps> = ({
  title,
  description,
  action,
  children,
  className = '',
}) => {
  return (
    <div className={`p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6 ${className}`}>
      {(title || action) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
          <div>
            {title && <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-100">{title}</h1>}
            {description && <p className="text-xs sm:text-sm text-slate-400 mt-1">{description}</p>}
          </div>
          {action && <div className="flex items-center gap-3 shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
};

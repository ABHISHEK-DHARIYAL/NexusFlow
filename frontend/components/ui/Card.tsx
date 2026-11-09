import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, hoverable = false, className = '', ...props }) => {
  return (
    <div
      className={`bg-slate-900/70 backdrop-blur-md border border-slate-800 rounded-xl p-5 shadow-sm transition-all duration-200 ${
        hoverable ? 'hover:border-slate-700 hover:shadow-md hover:bg-slate-800/80 cursor-pointer' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

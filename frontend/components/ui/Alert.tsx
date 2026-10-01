import React from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle, Info } from 'lucide-react';

export interface AlertProps {
  type?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({ type = 'info', title, children, className = '' }) => {
  const styles = {
    info: 'bg-blue-500/10 border-blue-500/20 text-blue-300',
    success: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300',
    warning: 'bg-amber-500/10 border-amber-500/20 text-amber-300',
    error: 'bg-rose-500/10 border-rose-500/20 text-rose-300',
  };

  const icons = {
    info: <Info className="w-5 h-5 text-blue-400 shrink-0" />,
    success: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />,
  };

  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl border ${styles[type]} ${className}`}>
      {icons[type]}
      <div className="flex-1 text-sm">
        {title && <h4 className="font-semibold mb-0.5">{title}</h4>}
        <div className="text-slate-300">{children}</div>
      </div>
    </div>
  );
};

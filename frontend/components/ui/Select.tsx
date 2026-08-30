import React, { forwardRef } from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, error, className = '', id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-xs font-medium text-slate-300">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={inputId}
          className={`w-full rounded-lg bg-slate-900/80 border text-slate-100 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50 px-3.5 py-2 cursor-pointer ${
            error ? 'border-red-500' : 'border-slate-800 focus:border-blue-500'
          } ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-slate-900 text-slate-100">
              {opt.label}
            </option>
          ))}
        </select>
        {error && <span className="text-xs text-red-400">{error}</span>}
      </div>
    );
  }
);

Select.displayName = 'Select';

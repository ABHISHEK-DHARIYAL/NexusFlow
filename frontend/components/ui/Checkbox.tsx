import React, { forwardRef } from 'react';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, className = '', id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <label htmlFor={inputId} className="inline-flex items-center gap-2.5 cursor-pointer select-none">
        <input
          type="checkbox"
          ref={ref}
          id={inputId}
          className={`w-4 h-4 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500/40 focus:ring-2 accent-blue-600 ${className}`}
          {...props}
        />
        {label && <span className="text-sm text-slate-300 font-medium">{label}</span>}
      </label>
    );
  }
);

Checkbox.displayName = 'Checkbox';

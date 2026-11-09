import React from 'react';

export interface AvatarProps {
  src?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ src, name = 'User', size = 'md', className = '' }) => {
  const sizeStyles = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-xl',
  };

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return src ? (
    <img
      src={src}
      alt={name}
      referrerPolicy="no-referrer"
      className={`rounded-full object-cover border border-slate-700/60 ${sizeStyles[size]} ${className}`}
    />
  ) : (
    <div
      className={`rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-semibold flex items-center justify-center border border-slate-700/60 ${sizeStyles[size]} ${className}`}
    >
      {initials}
    </div>
  );
};

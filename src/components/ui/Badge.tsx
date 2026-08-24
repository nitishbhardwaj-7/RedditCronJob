import React from 'react';
import { clsx } from 'clsx';
import { SeverityLevel, SentimentType } from '@/types/domain';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'severity' | 'sentiment';
  severity?: SeverityLevel;
  sentiment?: SentimentType;
  className?: string;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  severity,
  sentiment,
  className,
  size = 'md',
}) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  if (variant === 'severity' && severity) {
    const sevStyles = {
      critical: 'bg-red-950/80 text-red-400 border-red-800/60',
      high: 'bg-orange-950/80 text-orange-400 border-orange-800/60',
      medium: 'bg-amber-950/80 text-amber-400 border-amber-800/60',
      low: 'bg-blue-950/80 text-blue-400 border-blue-800/60',
    };
    return (
      <span
        className={clsx(
          'inline-flex items-center font-semibold rounded-full border uppercase tracking-wider',
          sizeClasses,
          sevStyles[severity],
          className
        )}
      >
        {children}
      </span>
    );
  }

  if (variant === 'sentiment' && sentiment) {
    const sentStyles = {
      negative: 'bg-red-900/40 text-red-300 border-red-800/50',
      positive: 'bg-emerald-900/40 text-emerald-300 border-emerald-800/50',
      neutral: 'bg-slate-800 text-slate-300 border-slate-700',
      mixed: 'bg-purple-900/40 text-purple-300 border-purple-800/50',
    };
    return (
      <span
        className={clsx(
          'inline-flex items-center font-medium rounded-full border capitalize',
          sizeClasses,
          sentStyles[sentiment],
          className
        )}
      >
        {children}
      </span>
    );
  }

  const baseStyles: Record<string, string> = {
    default: 'bg-slate-800 text-slate-300 border-slate-700',
    primary: 'bg-blue-950/80 text-blue-400 border-blue-800/60',
    success: 'bg-emerald-950/80 text-emerald-400 border-emerald-800/60',
    warning: 'bg-amber-950/80 text-amber-400 border-amber-800/60',
    danger: 'bg-red-950/80 text-red-400 border-red-800/60',
    info: 'bg-cyan-950/80 text-cyan-400 border-cyan-800/60',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center font-medium rounded-full border',
        sizeClasses,
        baseStyles[variant] || baseStyles.default,
        className
      )}
    >
      {children}
    </span>
  );
};

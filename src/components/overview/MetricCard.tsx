import React from 'react';
import { Card } from '../ui/Card';
import { clsx } from 'clsx';

interface MetricCardProps {
  title: string;
  value: number | string;
  description: string;
  icon: React.ReactNode;
  variant?: 'blue' | 'red' | 'purple' | 'emerald';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  description,
  icon,
  variant = 'blue',
}) => {
  const iconVariantStyles = {
    blue: 'bg-blue-600/15 text-blue-400 border-blue-500/30',
    red: 'bg-red-600/15 text-red-400 border-red-500/30',
    purple: 'bg-purple-600/15 text-purple-400 border-purple-500/30',
    emerald: 'bg-emerald-600/15 text-emerald-400 border-emerald-500/30',
  };

  return (
    <Card className="glass-card hover:border-slate-700/80 transition-all duration-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{title}</p>
          <h3 className="text-3xl font-bold text-white tracking-tight mt-1.5">{value}</h3>
          <p className="text-xs text-slate-400 mt-2">{description}</p>
        </div>
        <div className={clsx('w-12 h-12 rounded-xl border flex items-center justify-center shrink-0', iconVariantStyles[variant])}>
          {icon}
        </div>
      </div>
    </Card>
  );
};

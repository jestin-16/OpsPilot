import React from 'react';
import { Card } from './Card';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon, trend, className = '' }) => {
  return (
    <Card className={`flex flex-col ${className}`}>
      <div className="flex items-center justify-between mb-5">
        <h4 className="text-xs font-medium text-op-muted">{title}</h4>
        <div className="text-op-sage bg-op-sage-soft p-2 rounded-full">{icon}</div>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-medium tracking-tight tabular-nums text-op-fg">{value}</span>
        {trend && (
          <span className={`text-sm font-medium ${trend.isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
            {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}%
          </span>
        )}
      </div>
    </Card>
  );
};

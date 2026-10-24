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
        <h4 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-op-muted">{title}</h4>
        <div className="text-op-fg bg-op-raised p-2.5 rounded-xl">{icon}</div>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-semibold tracking-tight text-op-fg">{value}</span>
        {trend && (
          <span className={`text-sm font-medium ${trend.isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
            {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}%
          </span>
        )}
      </div>
    </Card>
  );
};

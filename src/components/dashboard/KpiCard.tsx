'use client';

/**
 * KPI card for the dashboard — shows a large metric with optional label and trend.
 */

import { cn } from '@/lib/utils';

interface KpiCardProps {
  title: string;
  value: string;
  unit?: string;
  subtitle?: string;
  highlight?: boolean;
  className?: string;
}

export function KpiCard({ title, value, unit, subtitle, highlight, className }: KpiCardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border p-5 shadow-card transition-all',
        highlight
          ? 'border-brand-green/30 bg-card-highlight text-brand-green shadow-green/20'
          : 'border-card-border bg-white hover:shadow-card-hover',
        className
      )}
    >
      <p className={cn('text-xs font-semibold uppercase tracking-wide', highlight ? 'text-brand-green/70' : 'text-gray-400')}>
        {title}
      </p>
      <p className={cn('mt-2 text-3xl font-bold tracking-tight', highlight ? 'text-brand-green' : 'text-gray-900')}>
        {value}
        {unit && <span className="ml-1 text-sm font-normal opacity-60">{unit}</span>}
      </p>
      {subtitle && <p className={cn('mt-1 text-xs', highlight ? 'text-brand-green/60' : 'text-gray-400')}>{subtitle}</p>}
    </div>
  );
}

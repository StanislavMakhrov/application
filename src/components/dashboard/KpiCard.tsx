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
        'relative rounded-2xl border overflow-hidden bg-white shadow-card transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5',
        highlight ? 'border-brand-green/30' : 'border-card-border',
        className
      )}
    >
      {/* Accent stripe */}
      <div
        className={cn(
          'h-1 w-full',
          highlight ? 'bg-gradient-card-accent' : 'bg-gradient-to-r from-gray-200 to-gray-100'
        )}
      />
      <div className="p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{title}</p>
        <p
          className={cn(
            'mt-2 text-3xl font-extrabold tracking-tight',
            highlight ? 'text-brand-green' : 'text-gray-900'
          )}
        >
          {value}
          {unit && (
            <span className="ml-1.5 text-base font-normal text-gray-400">{unit}</span>
          )}
        </p>
        {subtitle && <p className="mt-1.5 text-xs text-gray-400">{subtitle}</p>}
      </div>
    </div>
  );
}

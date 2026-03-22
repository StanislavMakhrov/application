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
        'rounded-lg border bg-white p-5 shadow-sm',
        highlight ? 'border-brand-green bg-brand-green-pale' : 'border-gray-200',
        className
      )}
    >
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className={cn('mt-1 text-3xl font-bold', highlight ? 'text-brand-green' : 'text-gray-900')}>
        {value}
        {unit && <span className="ml-1 text-base font-normal text-gray-500">{unit}</span>}
      </p>
      {subtitle && <p className="mt-1 text-xs text-gray-500">{subtitle}</p>}
    </div>
  );
}

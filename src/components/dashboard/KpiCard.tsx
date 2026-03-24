/**
 * KPI card for the dashboard — shows a large metric with optional label, icon, and trend.
 * Uses colored top border accent and hover shadow for a modern card appearance.
 *
 * NOTE: This is intentionally a Server Component (no 'use client') so that
 * Lucide icon component references can be passed from the Server Component page.
 */

import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string;
  unit?: string;
  subtitle?: string;
  highlight?: boolean;
  className?: string;
  icon?: LucideIcon;
  trend?: { value: number; label: string };
}

export function KpiCard({ title, value, unit, subtitle, highlight, className, icon: Icon, trend }: KpiCardProps) {
  const trendUp = trend && trend.value > 0;
  const trendDown = trend && trend.value < 0;

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-card border bg-white p-5 shadow-card transition-shadow hover:shadow-card-hover',
        highlight ? 'border-brand-green/30' : 'border-card-border',
        className
      )}
    >
      {/* Colored top accent */}
      <div
        className={cn(
          'absolute inset-x-0 top-0 h-1 rounded-t-card',
          highlight
            ? 'bg-gradient-to-r from-brand-green to-brand-green-light'
            : 'bg-gradient-to-r from-brand-green-light/40 to-brand-green-pale'
        )}
      />

      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{title}</p>
          <p className={cn('mt-2 text-3xl font-bold tracking-tight', highlight ? 'text-brand-green' : 'text-gray-900')}>
            {value}
            {unit && <span className="ml-1.5 text-sm font-normal text-gray-400">{unit}</span>}
          </p>
          {subtitle && <p className="mt-1 text-xs text-gray-400">{subtitle}</p>}
          {trend && (
            <p className={cn(
              'mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
              trendDown ? 'bg-green-50 text-green-700' : trendUp ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-500'
            )}>
              {trendDown ? '↓' : trendUp ? '↑' : '→'} {Math.abs(trend.value).toFixed(1)}% {trend.label}
            </p>
          )}
        </div>
        {Icon && (
          <div className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
            highlight ? 'bg-brand-green/10' : 'bg-brand-green-pale'
          )}>
            <Icon className={cn('h-5 w-5', highlight ? 'text-brand-green' : 'text-brand-green-light')} />
          </div>
        )}
      </div>
    </div>
  );
}

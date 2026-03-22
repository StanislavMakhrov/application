'use client';

/**
 * Year-over-year comparison bar chart for the dashboard.
 * Shows Scope 1/2/3 stacked bars for two years side by side.
 */

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { CO2eTotals } from '@/types';

interface YearOverYearChartProps {
  year1: number;
  totals1: CO2eTotals;
  year2: number;
  totals2: CO2eTotals;
}

export function YearOverYearChart({ year1, totals1, year2, totals2 }: YearOverYearChartProps) {
  const data = [
    {
      year: String(year1),
      'Scope 1': totals1.scope1,
      'Scope 2': totals1.scope2,
      'Scope 3': totals1.scope3,
    },
    {
      year: String(year2),
      'Scope 1': totals2.scope1,
      'Scope 2': totals2.scope2,
      'Scope 3': totals2.scope3,
    },
  ];

  const delta = totals2.total - totals1.total;
  const deltaPercent = totals1.total > 0 ? Math.abs((delta / totals1.total) * 100).toFixed(1) : '—';
  const improved = delta < 0;

  return (
    <div>
      <div className="mb-3 flex items-center gap-4">
        <span className="text-sm text-gray-500">
          Veränderung:{' '}
          <span className={improved ? 'font-semibold text-brand-green' : 'font-semibold text-red-600'}>
            {improved ? '▼' : '▲'} {Math.abs(delta).toFixed(2)} t ({deltaPercent === '—' ? '—' : `${deltaPercent}%`})
          </span>
        </span>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <XAxis dataKey="year" />
          <YAxis unit=" t" tick={{ fontSize: 11 }} />
          <Tooltip formatter={(v: number) => [`${v.toFixed(2)} t CO₂e`, '']} />
          <Legend />
          <Bar dataKey="Scope 1" stackId="a" fill="#2D6A4F" />
          <Bar dataKey="Scope 2" stackId="a" fill="#52B788" />
          <Bar dataKey="Scope 3" stackId="a" fill="#95D5B2" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

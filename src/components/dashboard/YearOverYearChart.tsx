'use client';

/**
 * Year-over-year comparison bar chart for the dashboard.
 * Shows Scope 1/2/3 stacked bars for two years side by side,
 * with a delta pill indicating improvement or regression.
 */

import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { CO2eTotals } from '@/types';

interface YearOverYearChartProps {
  year1: number;
  totals1: CO2eTotals;
  year2: number;
  totals2: CO2eTotals;
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; fill: string }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-card-border bg-white px-3 py-2 shadow-card text-xs min-w-[140px]">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 mt-0.5">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: p.fill }} />
          <span className="text-gray-500">{p.name}:</span>
          <span className="font-medium text-gray-800">{p.value.toFixed(2)} t</span>
        </div>
      ))}
    </div>
  );
}

export function YearOverYearChart({ year1, totals1, year2, totals2 }: YearOverYearChartProps) {
  const data = [
    { year: String(year1), 'Scope 1': totals1.scope1, 'Scope 2': totals1.scope2, 'Scope 3': totals1.scope3 },
    { year: String(year2), 'Scope 1': totals2.scope1, 'Scope 2': totals2.scope2, 'Scope 3': totals2.scope3 },
  ];

  const delta = totals2.total - totals1.total;
  const deltaPercent = totals1.total > 0 ? Math.abs((delta / totals1.total) * 100).toFixed(1) : null;
  const improved = delta < 0;

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <span className="text-xs text-gray-500">Veränderung:</span>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
          improved ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
        }`}>
          {improved ? '↓' : '↑'} {Math.abs(delta).toFixed(2)} t
          {deltaPercent ? ` (${deltaPercent}%)` : ''}
        </span>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 4, right: 20, left: 0, bottom: 4 }} barGap={4}>
          <XAxis
            dataKey="year"
            tick={{ fontSize: 12, fontWeight: 600, fill: '#374151' }}
            axisLine={{ stroke: '#e5e7eb' }}
            tickLine={false}
          />
          <YAxis
            unit=" t"
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(45,106,79,0.05)' }} />
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(v) => <span className="text-xs text-gray-600">{v}</span>}
          />
          <Bar dataKey="Scope 1" stackId="a" fill="#2D6A4F" maxBarSize={56} />
          <Bar dataKey="Scope 2" stackId="a" fill="#52B788" maxBarSize={56} />
          <Bar dataKey="Scope 3" stackId="a" fill="#95D5B2" radius={[4, 4, 0, 0]} maxBarSize={56} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

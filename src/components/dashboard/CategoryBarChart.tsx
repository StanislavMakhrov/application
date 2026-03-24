'use client';

/**
 * Horizontal bar chart showing CO₂e per category for the dashboard.
 * Bars are color-coded by scope with a custom tooltip for cleaner presentation.
 */

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { CATEGORY_LABELS } from '@/types';

interface CategoryBarChartProps {
  byCategory: Record<string, number>;
}

const SCOPE_COLORS: Record<string, string> = {
  ERDGAS: '#2D6A4F', HEIZOEL: '#2D6A4F', FLUESSIGGAS: '#2D6A4F',
  DIESEL_FUHRPARK: '#2D6A4F', BENZIN_FUHRPARK: '#2D6A4F',
  PKW_BENZIN_KM: '#2D6A4F', PKW_DIESEL_KM: '#2D6A4F', TRANSPORTER_KM: '#2D6A4F', LKW_KM: '#2D6A4F',
  STROM: '#52B788', FERNWAERME: '#52B788',
  GESCHAEFTSREISEN_FLUG: '#74C69D', GESCHAEFTSREISEN_BAHN: '#74C69D', PENDLERVERKEHR: '#74C69D',
  ABFALL_RESTMUELL: '#74C69D', ABFALL_BAUSCHUTT: '#74C69D', ABFALL_ALTMETALL: '#F4A261',
  ABFALL_SONSTIGES: '#74C69D',
  KUPFER: '#95D5B2', STAHL: '#95D5B2', ALUMINIUM: '#95D5B2', HOLZ: '#95D5B2',
  KUNSTSTOFF_PVC: '#95D5B2', BETON: '#95D5B2', FARBEN_LACKE: '#95D5B2', SONSTIGE: '#95D5B2',
};

// Bar styling constants
const BAR_BORDER_RADIUS: [number, number, number, number] = [0, 6, 6, 0];
const MAX_BAR_SIZE = 22;

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; payload: { name: string } }>;
}

function CustomTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-card-border bg-white px-3 py-2 shadow-card text-xs">
      <p className="font-semibold text-gray-700">{payload[0].payload.name}</p>
      <p className="text-brand-green mt-0.5">{payload[0].value.toFixed(3)} t CO₂e</p>
    </div>
  );
}

export function CategoryBarChart({ byCategory }: CategoryBarChartProps) {
  const data = Object.entries(byCategory)
    .filter(([, v]) => v !== 0)
    .sort(([, a], [, b]) => Math.abs(b) - Math.abs(a))
    .map(([key, value]) => ({
      key,
      name: (CATEGORY_LABELS as Record<string, string>)[key] ?? key,
      value: Math.round(value * 1000) / 1000,
    }));

  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-gray-400">
        Noch keine Kategorien erfasst
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={Math.max(200, data.length * 38)}>
      <BarChart data={data} layout="vertical" margin={{ left: 140, right: 24, top: 4, bottom: 4 }}>
        <XAxis
          type="number"
          unit=" t"
          tick={{ fontSize: 10, fill: '#9ca3af' }}
          axisLine={{ stroke: '#e5e7eb' }}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fontSize: 11, fill: '#6b7280' }}
          width={132}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(45,106,79,0.05)' }} />
        <Bar dataKey="value" radius={BAR_BORDER_RADIUS} maxBarSize={MAX_BAR_SIZE}>
          {data.map((entry) => (
            <Cell key={entry.key} fill={SCOPE_COLORS[entry.key] ?? '#74C69D'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

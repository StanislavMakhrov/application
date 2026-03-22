'use client';

/**
 * Horizontal bar chart showing CO₂e per category for the dashboard.
 * Bars are color-coded by scope.
 */

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { CATEGORY_LABELS } from '@/types';

interface CategoryBarChartProps {
  byCategory: Record<string, number>;
}

const SCOPE_COLORS: Record<string, string> = {
  // Scope 1 categories
  ERDGAS: '#2D6A4F',
  HEIZOEL: '#2D6A4F',
  FLUESSIGGAS: '#2D6A4F',
  DIESEL_FUHRPARK: '#2D6A4F',
  BENZIN_FUHRPARK: '#2D6A4F',
  PKW_BENZIN_KM: '#2D6A4F',
  PKW_DIESEL_KM: '#2D6A4F',
  TRANSPORTER_KM: '#2D6A4F',
  LKW_KM: '#2D6A4F',
  // Scope 2 categories
  STROM: '#52B788',
  FERNWAERME: '#52B788',
  // Scope 3 categories
  GESCHAEFTSREISEN_FLUG: '#74C69D',
  GESCHAEFTSREISEN_BAHN: '#74C69D',
  PENDLERVERKEHR: '#74C69D',
  ABFALL_RESTMUELL: '#74C69D',
  ABFALL_BAUSCHUTT: '#74C69D',
  ABFALL_ALTMETALL: '#F4A261',
  ABFALL_SONSTIGES: '#74C69D',
  KUPFER: '#95D5B2',
  STAHL: '#95D5B2',
  ALUMINIUM: '#95D5B2',
  HOLZ: '#95D5B2',
  KUNSTSTOFF_PVC: '#95D5B2',
  BETON: '#95D5B2',
  FARBEN_LACKE: '#95D5B2',
  SONSTIGE: '#95D5B2',
};

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
    <ResponsiveContainer width="100%" height={Math.max(200, data.length * 36)}>
      <BarChart data={data} layout="vertical" margin={{ left: 140, right: 20, top: 5, bottom: 5 }}>
        <XAxis type="number" unit=" t" tick={{ fontSize: 11 }} />
        <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={130} />
        <Tooltip formatter={(v: number) => [`${v.toFixed(3)} t CO₂e`, 'CO₂e']} />
        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
          {data.map((entry) => (
            <Cell key={entry.key} fill={SCOPE_COLORS[entry.key] ?? '#74C69D'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

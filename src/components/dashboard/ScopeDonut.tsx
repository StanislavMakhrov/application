'use client';

/**
 * Donut chart showing Scope 1 / 2 / 3 CO₂e breakdown for the dashboard.
 * Uses Recharts PieChart in donut style.
 */

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ScopeDonutProps {
  scope1: number;
  scope2: number;
  scope3: number;
}

const COLORS = ['#2D6A4F', '#52B788', '#B7E4C7'];

export function ScopeDonut({ scope1, scope2, scope3 }: ScopeDonutProps) {
  const data = [
    { name: 'Scope 1 (direkt)', value: Math.max(0, scope1) },
    { name: 'Scope 2 (Energie)', value: Math.max(0, scope2) },
    { name: 'Scope 3 (vorgelagert)', value: Math.max(0, scope3) },
  ].filter((d) => d.value > 0);

  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-gray-400">
        Noch keine Daten erfasst
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          dataKey="value"
          label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
          labelLine={false}
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number) => [`${value.toFixed(2)} t CO₂e`, '']}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

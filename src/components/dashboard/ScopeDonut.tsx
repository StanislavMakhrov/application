'use client';

/**
 * Donut chart showing Scope 1 / 2 / 3 CO₂e breakdown for the dashboard.
 * Displays a centered total label, custom tooltip, and legend.
 */

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ScopeDonutProps {
  scope1: number;
  scope2: number;
  scope3: number;
}

const COLORS = ['#2D6A4F', '#52B788', '#95D5B2'];

// Donut geometry constants
const INNER_RADIUS = 70;
const OUTER_RADIUS = 105;
const PADDING_ANGLE = 3;

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: { name: string; value: number } }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="rounded-lg border border-card-border bg-white px-3 py-2 shadow-card text-xs">
      <p className="font-semibold text-gray-700">{item.name}</p>
      <p className="text-brand-green mt-0.5">{item.value.toFixed(2)} t CO₂e</p>
    </div>
  );
}

export function ScopeDonut({ scope1, scope2, scope3 }: ScopeDonutProps) {
  const total = scope1 + scope2 + scope3;
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
    <div className="relative">
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="45%"
            innerRadius={INNER_RADIUS}
            outerRadius={OUTER_RADIUS}
            paddingAngle={PADDING_ANGLE}
            dataKey="value"
            strokeWidth={0}
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(value) => <span className="text-xs text-gray-600">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
      {/* Center label showing total CO₂e — positioned to sit inside the donut hole */}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center -mt-5 justify-center">
        <span className="text-2xl font-bold text-gray-900">{total.toFixed(1)}</span>
        <span className="text-xs text-gray-400 mt-0.5">t CO₂e</span>
      </div>
    </div>
  );
}

'use client';

import type { BenchmarkData } from '@/types';

interface BenchmarkChartProps {
  companyTotal: number;
  benchmark: BenchmarkData;
  companyName: string;
}

/**
 * SVG-based benchmark chart comparing company CO₂ to industry quartiles.
 * Shows company value relative to P25, median, and P75 of the Branche.
 */
export function BenchmarkChart({ companyTotal, benchmark, companyName }: BenchmarkChartProps) {
  const { p25_t, median_t, p75_t } = benchmark;

  // Scale all values to fit in chart (max = p75 * 1.3 or company total, whichever bigger)
  const maxVal = Math.max(p75_t * 1.3, companyTotal * 1.1);
  const chartWidth = 400;
  const barHeight = 32;
  const gap = 12;
  const labelWidth = 160;
  const rightPad = 60;
  const innerWidth = chartWidth - labelWidth - rightPad;

  function toX(val: number) {
    return (val / maxVal) * innerWidth;
  }

  const bars = [
    { label: '25. Perzentile', value: p25_t, color: '#86efac' },
    { label: 'Median', value: median_t, color: '#22c55e' },
    { label: '75. Perzentile', value: p75_t, color: '#15803d' },
    { label: companyName, value: companyTotal, color: '#1d4ed8', isCompany: true },
  ];

  const totalHeight = bars.length * (barHeight + gap) + 20;

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${chartWidth} ${totalHeight}`}
        className="w-full max-w-xl"
        role="img"
        aria-label={`Branchenvergleich: Ihr Betrieb mit ${companyTotal.toFixed(1)} t CO₂ im Vergleich zum Branchenmedian von ${median_t} t`}
      >
        {bars.map((bar, i) => {
          const y = i * (barHeight + gap) + 10;
          const barW = toX(bar.value);

          return (
            <g key={bar.label}>
              {/* Label */}
              <text
                x={labelWidth - 8}
                y={y + barHeight / 2 + 4}
                textAnchor="end"
                fontSize={11}
                fill={bar.isCompany ? '#1e40af' : '#374151'}
                fontWeight={bar.isCompany ? 'bold' : 'normal'}
              >
                {bar.label}
              </text>

              {/* Bar background */}
              <rect
                x={labelWidth}
                y={y}
                width={innerWidth}
                height={barHeight}
                rx={4}
                fill="#f3f4f6"
              />

              {/* Bar fill */}
              <rect
                x={labelWidth}
                y={y}
                width={Math.max(barW, 4)}
                height={barHeight}
                rx={4}
                fill={bar.color}
                opacity={bar.isCompany ? 0.9 : 0.7}
              />

              {/* Value label */}
              <text
                x={labelWidth + Math.max(barW, 4) + 6}
                y={y + barHeight / 2 + 4}
                fontSize={11}
                fill={bar.isCompany ? '#1e40af' : '#374151'}
                fontWeight={bar.isCompany ? 'bold' : 'normal'}
              >
                {bar.value.toFixed(1)} t
              </text>
            </g>
          );
        })}
      </svg>

      {/* Legend / status */}
      <div className="mt-3 text-sm text-gray-600">
        {companyTotal <= p25_t && (
          <span className="text-green-700 font-medium">
            ✅ Ausgezeichnet! Ihr Betrieb liegt im besten Viertel der Branche.
          </span>
        )}
        {companyTotal > p25_t && companyTotal <= median_t && (
          <span className="text-green-600">
            👍 Gut – Sie liegen unter dem Branchenmedian.
          </span>
        )}
        {companyTotal > median_t && companyTotal <= p75_t && (
          <span className="text-amber-600">
            ⚠️ Verbesserungspotenzial – Sie liegen über dem Branchenmedian.
          </span>
        )}
        {companyTotal > p75_t && (
          <span className="text-red-600">
            🔴 Handlungsbedarf – Sie liegen im oberen Viertel der Branche.
          </span>
        )}
      </div>
    </div>
  );
}

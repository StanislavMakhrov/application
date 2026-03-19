/**
 * Dashboard charts component for GrünBilanz.
 * Uses simple inline SVG and CSS — no external chart libraries required.
 * Renders scope breakdown bars and year-over-year comparison.
 */

'use client';

interface DashboardChartsProps {
  latestTotals: { SCOPE1: number; SCOPE2: number; SCOPE3: number };
  prevTotals: { SCOPE1: number; SCOPE2: number; SCOPE3: number } | null;
  latestYear: number;
  prevYear: number | undefined;
  categoryBreakdown: Record<string, number>;
  benchmarkTotal: number | null;
  companyTotal: number;
  yoyChange: string | null;
}

/** Renders a horizontal bar showing a value relative to a max */
function Bar({
  label,
  value,
  max,
  color,
  unit = 't CO₂e',
}: {
  label: string;
  value: number;
  max: number;
  color: string;
  unit?: string;
}) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const tonnes = (value / 1000).toFixed(1);

  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="w-32 text-xs text-gray-600 shrink-0 truncate">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
        <div
          className={`h-4 rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-20 text-xs text-right text-gray-700 font-medium shrink-0">
        {tonnes} {unit}
      </span>
    </div>
  );
}

export default function DashboardCharts({
  latestTotals,
  prevTotals,
  latestYear,
  prevYear,
  categoryBreakdown,
  benchmarkTotal,
  companyTotal,
  yoyChange,
}: DashboardChartsProps) {
  const scopeMax = Math.max(latestTotals.SCOPE1, latestTotals.SCOPE2, latestTotals.SCOPE3, 1);
  const catMax = Math.max(...Object.values(categoryBreakdown), 1);

  const yoyNum = yoyChange ? parseFloat(yoyChange) : null;
  const yoyImproved = yoyNum !== null && yoyNum < 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Scope breakdown chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h2 className="text-base font-semibold text-gray-800 mb-4">
          Scope-Übersicht · {latestYear}
        </h2>
        <div className="space-y-1">
          <Bar
            label="Scope 1 – Direkt"
            value={latestTotals.SCOPE1}
            max={scopeMax}
            color="bg-amber-400"
          />
          <Bar
            label="Scope 2 – Energie"
            value={latestTotals.SCOPE2}
            max={scopeMax}
            color="bg-blue-400"
          />
          <Bar
            label="Scope 3 – Wertschöpfung"
            value={latestTotals.SCOPE3}
            max={scopeMax}
            color="bg-purple-400"
          />
        </div>

        {/* SVG pie chart using conic-gradient workaround with simple circle */}
        <div className="mt-4 flex justify-center">
          <ScopePieChart
            scope1={latestTotals.SCOPE1}
            scope2={latestTotals.SCOPE2}
            scope3={latestTotals.SCOPE3}
          />
        </div>
      </div>

      {/* Year-over-year comparison */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h2 className="text-base font-semibold text-gray-800 mb-4">
          Jahresvergleich
          {yoyChange && (
            <span
              className={`ml-2 text-sm font-normal ${
                yoyImproved ? 'text-green-600' : 'text-red-500'
              }`}
            >
              {yoyImproved ? '▼' : '▲'} {Math.abs(parseFloat(yoyChange))}%
            </span>
          )}
        </h2>

        {prevTotals && prevYear ? (
          <div className="space-y-4">
            {(
              [
                { label: 'Scope 1', latest: latestTotals.SCOPE1, prev: prevTotals.SCOPE1, color: 'bg-amber-400' },
                { label: 'Scope 2', latest: latestTotals.SCOPE2, prev: prevTotals.SCOPE2, color: 'bg-blue-400' },
                { label: 'Scope 3', latest: latestTotals.SCOPE3, prev: prevTotals.SCOPE3, color: 'bg-purple-400' },
              ] as Array<{ label: string; latest: number; prev: number; color: string }>
            ).map(({ label, latest, prev, color }) => {
              const yoyMax = Math.max(latest, prev, 1);
              return (
                <div key={label}>
                  <p className="text-xs text-gray-500 mb-1">{label}</p>
                  <div className="flex items-center gap-2">
                    <span className="w-10 text-xs text-gray-400 shrink-0">{prevYear}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-3 rounded-full opacity-40 ${color}`}
                        style={{ width: `${(prev / yoyMax) * 100}%` }}
                      />
                    </div>
                    <span className="w-16 text-xs text-right text-gray-500 shrink-0">
                      {(prev / 1000).toFixed(1)} t
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="w-10 text-xs text-gray-700 font-medium shrink-0">{latestYear}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-3 rounded-full ${color}`}
                        style={{ width: `${(latest / yoyMax) * 100}%` }}
                      />
                    </div>
                    <span className="w-16 text-xs text-right font-semibold text-gray-700 shrink-0">
                      {(latest / 1000).toFixed(1)} t
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-400 italic">
            Kein Vorjahresvergleich verfügbar.
          </p>
        )}

        {/* Benchmark comparison bar */}
        {benchmarkTotal && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500 mb-2">Vergleich mit Branchendurchschnitt</p>
            <Bar
              label="Ihr Betrieb"
              value={companyTotal}
              max={Math.max(companyTotal, benchmarkTotal)}
              color="bg-green-500"
            />
            <Bar
              label="Branche Ø"
              value={benchmarkTotal}
              max={Math.max(companyTotal, benchmarkTotal)}
              color="bg-gray-300"
            />
          </div>
        )}
      </div>

      {/* Category breakdown */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:col-span-2">
        <h2 className="text-base font-semibold text-gray-800 mb-4">
          Emissionen nach Kategorie · {latestYear}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
          {Object.entries(categoryBreakdown)
            .sort(([, a], [, b]) => b - a)
            .map(([cat, val]) => (
              <Bar
                key={cat}
                label={cat}
                value={val}
                max={catMax}
                color="bg-green-500"
              />
            ))}
        </div>
      </div>
    </div>
  );
}

/** Simple SVG pie chart for scope distribution */
function ScopePieChart({
  scope1,
  scope2,
  scope3,
}: {
  scope1: number;
  scope2: number;
  scope3: number;
}) {
  const total = scope1 + scope2 + scope3;
  if (total === 0) return null;

  const r = 40;
  const cx = 50;
  const cy = 50;
  const circumference = 2 * Math.PI * r;

  // Calculate percentages
  const pct1 = scope1 / total;
  const pct2 = scope2 / total;
  const pct3 = scope3 / total;

  // SVG stroke-dasharray pie chart segments
  const seg1 = pct1 * circumference;
  const seg2 = pct2 * circumference;
  const seg3 = pct3 * circumference;
  const gap = 0;

  const offset1 = 0;
  const offset2 = -(seg1 + gap);
  const offset3 = -(seg1 + seg2 + gap * 2);

  return (
    <div>
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="#fbbf24"
          strokeWidth="18"
          strokeDasharray={`${seg1} ${circumference - seg1}`}
          strokeDashoffset={offset1}
          transform={`rotate(-90 ${cx} ${cy})`}
        />
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="#60a5fa"
          strokeWidth="18"
          strokeDasharray={`${seg2} ${circumference - seg2}`}
          strokeDashoffset={offset2}
          transform={`rotate(-90 ${cx} ${cy})`}
        />
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="#a78bfa"
          strokeWidth="18"
          strokeDasharray={`${seg3} ${circumference - seg3}`}
          strokeDashoffset={offset3}
          transform={`rotate(-90 ${cx} ${cy})`}
        />
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize="9" fill="#374151" fontFamily="sans-serif">
          Gesamt
        </text>
        <text x={cx} y={cy + 8} textAnchor="middle" fontSize="8" fill="#6b7280" fontFamily="sans-serif">
          {(total / 1000).toFixed(0)} t
        </text>
      </svg>
      {/* Legend */}
      <div className="flex justify-center gap-3 text-xs mt-1">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 bg-amber-400 rounded-full inline-block" />S1
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 bg-blue-400 rounded-full inline-block" />S2
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 bg-purple-400 rounded-full inline-block" />S3
        </span>
      </div>
    </div>
  );
}

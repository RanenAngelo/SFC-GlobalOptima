import { useId } from 'react';
import { Area, Bar, BarChart, CartesianGrid, Cell, ComposedChart, Legend, Line, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend as RLegend } from 'recharts';
import { ChartTooltip } from './chartParts';
import { useChartTheme } from '../ui/ChartCard';
import { shortDate } from '../../utils/format';

interface TrendProps {
  data: Record<string, unknown>[];
  xKey: string;
  series: { key: string; name: string; color?: string }[];
  format?: (v: number) => string;
  area?: boolean;
  height?: number;
  showLegend?: boolean;
  premium?: boolean;
}

export function TrendChart({ data, xKey, series, format, area = true, height = 260, showLegend, premium = false }: TrendProps) {
  const t = useChartTheme();
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const hasComparison = premium && data.some((point) => typeof point.compare === 'number');
  const chartSeries = hasComparison
    ? [...series, { key: 'compare', name: 'Previous period', color: 'var(--chart-compare)' }]
    : series;
  return (
    <div className={premium ? 'trend-chart trend-chart--glass' : 'trend-chart'} style={{ height }}>
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={data} margin={{ top: 12, right: 14, left: premium ? 3 : -8, bottom: 4 }}>
          <defs>
            {chartSeries.map((s, i) => (
              <linearGradient key={s.key} id={`trend-${id}-${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color ?? t.palette[i % t.palette.length]} stopOpacity={premium ? 0.20 : 0.28} />
                <stop offset="76%" stopColor={s.color ?? t.palette[i % t.palette.length]} stopOpacity={premium ? 0.045 : 0.10} />
                <stop offset="100%" stopColor={s.color ?? t.palette[i % t.palette.length]} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid stroke={premium ? 'var(--chart-grid)' : t.grid} vertical={false} strokeDasharray={premium ? '2 7' : '3 3'} />
          <XAxis
            dataKey={xKey} tick={{ fill: t.text, fontSize: premium ? 10 : 11 }} tickLine={false} axisLine={{ stroke: t.axis }}
            tickFormatter={(v) => shortDate(String(v))} minTickGap={premium ? 28 : 34} padding={{ left: 4, right: 4 }}
          />
          <YAxis tick={{ fill: t.text, fontSize: premium ? 10 : 11 }} tickLine={false} axisLine={false} width={premium ? 64 : 54} tickFormatter={format} />
          <Tooltip content={<ChartTooltip format={format} />} cursor={{ stroke: t.axis, strokeDasharray: '3 5' }} />
          {showLegend && <RLegend wrapperStyle={{ fontSize: 11, color: t.text, paddingTop: 8 }} iconType="circle" iconSize={7} />}
          {chartSeries.map((s, i) => {
            const color = s.color ?? t.palette[i % t.palette.length];
            const isComparison = s.key === 'compare';
            if (isComparison || !area) {
              return (
                <Line
                  key={s.key} type={premium ? 'linear' : 'monotone'} dataKey={s.key} name={s.name}
                  stroke={color} strokeWidth={premium ? (isComparison ? 1.5 : 2.2) : 2}
                  strokeDasharray={isComparison ? '5 5' : undefined}
                  strokeOpacity={isComparison ? 0.7 : 1}
                  style={premium && !isComparison ? { filter: `drop-shadow(0 0 3px ${color})` } : undefined}
                  dot={false} activeDot={{ r: premium ? 5 : 4, stroke: 'var(--bg-1)', strokeWidth: 2, fill: color }}
                  animationDuration={650} animationEasing="ease-out"
                />
              );
            }
            return (
              <Area
                key={s.key} type={premium ? 'linear' : 'monotone'} dataKey={s.key} name={s.name}
                stroke={color} strokeWidth={premium ? 2.2 : 2}
                style={premium ? { filter: `drop-shadow(0 0 3px ${color})` } : undefined}
                fill={`url(#trend-${id}-${i})`} dot={false}
                activeDot={{ r: 5, stroke: 'var(--bg-1)', strokeWidth: 2, fill: color }}
                animationDuration={650} animationEasing="ease-out"
              />
            );
          })}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ----------------------------- Ranked bars ----------------------------- */

interface RankProps {
  data: { name: string; value: number; alt?: number; rawAlt?: number }[];
  format?: (v: number) => string;
  height?: number;
  colorIndex?: number;
  showAlt?: boolean;
  valueName?: string;
  altName?: string;
}

export function RankBars({
  data,
  format,
  height,
  colorIndex = 0,
  showAlt,
  valueName = 'Revenue',
  altName = 'Profit',
}: RankProps) {
  const t = useChartTheme();
  const h = height ?? Math.max(200, data.length * 34);

  // Prevent horizontal bars from extending in the opposite direction (leftwards) into labels.
  // Real values are preserved in rawAlt and rawValue for accurate tooltips and metrics.
  const chartData = data.map((d) => ({
    ...d,
    displayValue: Math.max(0, d.value),
    displayAlt: d.alt !== undefined ? Math.max(0, d.alt) : undefined,
    rawAlt: d.rawAlt !== undefined ? d.rawAlt : d.alt,
    rawValue: d.value,
  }));

  return (
    <ResponsiveContainer width="100%" height={h}>
      <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 16, left: 4, bottom: 4 }}>
        <CartesianGrid stroke={t.grid} horizontal={false} />
        <XAxis type="number" domain={[0, 'auto']} tick={{ fill: t.text, fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={format} />
        <YAxis type="category" dataKey="name" tick={{ fill: t.text, fontSize: 11 }} tickLine={false} axisLine={false} width={130} interval={0} />
        <Tooltip
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null;
            const entry = payload[0]?.payload as (typeof chartData)[0];
            return (
              <div
                className="chart-tooltip-glass"
                style={{
                  background: 'var(--chart-tooltip-bg)',
                  border: '1px solid var(--border-strong)',
                  borderRadius: 10,
                  padding: '8px 12px',
                  boxShadow: 'var(--shadow-2)',
                  fontSize: 'var(--fs-xs)',
                  backdropFilter: 'blur(14px)',
                  maxWidth: 270,
                }}
              >
                <div className="eyebrow" style={{ marginBottom: 6 }}>{String(label ?? '')}</div>
                <div style={{ display: 'grid', gap: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-2)' }}>
                      <span style={{ width: 8, height: 8, borderRadius: 2, background: t.palette[colorIndex % t.palette.length] }} />
                      {valueName}
                    </span>
                    <span className="tabular" style={{ fontWeight: 700 }}>
                      {format ? format(entry.rawValue) : String(entry.rawValue)}
                    </span>
                  </div>
                  {showAlt && entry.rawAlt !== undefined && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-2)' }}>
                        <span style={{ width: 8, height: 8, borderRadius: 2, background: entry.rawAlt < 0 ? 'var(--danger)' : t.palette[(colorIndex + 2) % t.palette.length] }} />
                        {altName}
                      </span>
                      <span className="tabular" style={{ fontWeight: 700, color: entry.rawAlt < 0 ? 'var(--danger)' : undefined }}>
                        {format ? format(entry.rawAlt) : String(entry.rawAlt)}
                        {entry.rawAlt < 0 && <span style={{ fontSize: 10, marginLeft: 4, opacity: 0.8 }}>(Loss)</span>}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          }}
          cursor={{ fill: t.grid }}
        />
        <Bar dataKey="displayValue" name={valueName} fill={t.palette[colorIndex % t.palette.length]} radius={[0, 6, 6, 0]} barSize={16} />
        {showAlt && (
          <Bar dataKey="displayAlt" name={altName} fill={t.palette[(colorIndex + 2) % t.palette.length]} radius={[0, 6, 6, 0]} barSize={16} opacity={0.65} />
        )}
      </BarChart>
    </ResponsiveContainer>
  );
}

/* -------------------------------- Donut -------------------------------- */

interface DonutProps {
  data: { name: string; value: number }[];
  height?: number;
  format?: (v: number) => string;
}

export function Donut({ data, height = 240, format }: DonutProps) {
  const t = useChartTheme();
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data} dataKey="value" nameKey="name" innerRadius="62%" outerRadius="88%"
          paddingAngle={3} stroke="none" isAnimationActive={false}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={t.palette[i % t.palette.length]} />
          ))}
        </Pie>
        <Tooltip content={<ChartTooltip format={format} />} />
        <RLegend
          wrapperStyle={{ fontSize: 12, color: t.text, paddingTop: 8 }}
          iconType="circle" iconSize={8}
          formatter={(value) => String(value)}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

export { Legend };

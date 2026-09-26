import { CartesianGrid, Cell, ReferenceArea, ReferenceLine, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from 'recharts';
import { PerformanceClass } from '../../api/types';
import { useChartTheme } from '../ui/ChartCard';

export interface Pt { x: number; y: number; label: string; extra?: string; size?: number }

function ScatTip({ active, payload }: { active?: boolean; payload?: Array<{ payload: Pt }> }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div style={{
      background: 'var(--chart-tooltip-bg)', border: '1px solid var(--border-strong)',
      borderRadius: 10, padding: '8px 12px', fontSize: 'var(--fs-xs)', boxShadow: 'var(--shadow-2)', maxWidth: 240,
    }}>
      <div style={{ fontWeight: 700, marginBottom: 4 }}>{p.label}</div>
      <div className="muted">{p.extra}</div>
    </div>
  );
}

export const CLASS_COLOR: Record<PerformanceClass, string> = {
  profit_driver: 'var(--chart-3)',
  volume_driver: 'var(--chart-2)',
  hidden_opportunity: 'var(--chart-1)',
  low_performer: 'var(--chart-5)',
};

export function resolveClassColor(c: PerformanceClass): string {
  const map: Record<PerformanceClass, string> = {
    profit_driver: '#3ecf8e',
    volume_driver: '#5b8cff',
    hidden_opportunity: '#d9a441',
    low_performer: '#f0715c',
  };
  return map[c];
}

/**
 * Classification quadrant (Step 10): demand vs profitability with the
 * four performance-class regions visible at a glance.
 */
export function QuadrantScatter({
  points, xThreshold = 50, yThreshold = 35,
  xLabel = 'Demand index', yLabel = 'Profitability %', height = 320,
}: { points: (Pt & { cls: PerformanceClass })[]; xThreshold?: number; yThreshold?: number; xLabel?: string; yLabel?: string; height?: number }) {
  const t = useChartTheme();
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const xMin = Math.min(...xs, 0) - 5;
  const xMax = Math.max(...xs, 100) + 5;
  // Bound negative Y to prevent loss-maker outliers from distorting the quadrant geometry
  const yMin = Math.max(-25, Math.min(...ys, 0) - 5);
  const yMax = Math.max(...ys, 100) + 5;
  const intTick = (v: number) => String(Math.round(v));
  const sanitizedPoints = points.map((p) => ({ ...p, y: Math.max(-22, p.y) }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ScatterChart margin={{ top: 14, right: 16, left: 0, bottom: 20 }}>
        <CartesianGrid stroke={t.grid} />
        <XAxis type="number" dataKey="x" name={xLabel} tick={{ fill: t.text, fontSize: 11 }} axisLine={{ stroke: t.axis }} tickLine={false}
          domain={[xMin, xMax]} tickFormatter={intTick} tickMargin={8}
          label={{ value: xLabel, position: 'insideBottom', offset: -12, fill: t.text, fontSize: 10.5 }} />
        <YAxis type="number" dataKey="y" name={yLabel} tick={{ fill: t.text, fontSize: 11 }} axisLine={false} tickLine={false}
          domain={[yMin, yMax]} width={44} tickFormatter={intTick} tickMargin={4} />
        <Tooltip content={<ScatTip />} cursor={{ strokeDasharray: '3 3', stroke: t.axis }} />

        {/* quadrant fills */}
        <ReferenceArea x1={xThreshold} x2={xMax} y1={yThreshold} y2={yMax} fill="#3ecf8e" fillOpacity={0.05} />
        <ReferenceArea x1={xThreshold} x2={xMax} y1={yMin} y2={yThreshold} fill="#5b8cff" fillOpacity={0.05} />
        <ReferenceArea x1={xMin} x2={xThreshold} y1={yThreshold} y2={yMax} fill="#d9a441" fillOpacity={0.05} />
        <ReferenceArea x1={xMin} x2={xThreshold} y1={yMin} y2={yThreshold} fill="#f0715c" fillOpacity={0.05} />
        <ReferenceLine x={xThreshold} stroke={t.axis} strokeDasharray="4 4" />
        <ReferenceLine y={yThreshold} stroke={t.axis} strokeDasharray="4 4" />
        {yMin < 0 && <ReferenceLine y={0} stroke="var(--border-strong)" strokeDasharray="2 2" />}

        <Scatter data={sanitizedPoints} isAnimationActive={false}>
          {sanitizedPoints.map((p, i) => (
            <Cell key={i} fill={resolveClassColor(p.cls)} fillOpacity={0.85} />
          ))}
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  );
}

/** Generic relationship scatter (price vs demand, rating vs margin, …). */
export function BasicScatter({
  points, xLabel, yLabel, trend, height = 280,
}: { points: Pt[]; xLabel: string; yLabel: string; trend?: number; height?: number }) {
  const t = useChartTheme();
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ScatterChart margin={{ top: 14, right: 16, left: 0, bottom: 20 }}>
        <CartesianGrid stroke={t.grid} />
        <XAxis type="number" dataKey="x" tick={{ fill: t.text, fontSize: 11 }} axisLine={{ stroke: t.axis }} tickLine={false}
          label={{ value: xLabel, position: 'insideBottom', offset: -12, fill: t.text, fontSize: 10.5 }} />
        <YAxis type="number" dataKey="y" tick={{ fill: t.text, fontSize: 11 }} axisLine={false} tickLine={false} width={46} />
        <Tooltip content={<ScatTip />} cursor={{ strokeDasharray: '3 3', stroke: t.axis }} />
        <Scatter data={points} fill={t.palette[1]} fillOpacity={0.8} isAnimationActive={false} />
        {trend !== undefined && (
          <ReferenceLine stroke={t.palette[5]} strokeDasharray="6 4" segment={[{ x: 0, y: 0 }, { x: 100, y: trend }]} />
        )}
      </ScatterChart>
    </ResponsiveContainer>
  );
}

import { Area, CartesianGrid, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ForecastPoint } from '../../api/types';
import { ChartTooltip } from './chartParts';
import { useChartTheme } from '../ui/ChartCard';
import { fmtInt, shortDate } from '../../utils/format';

/** Historical actual vs predicted + confidence band (Step 46). */
export function ForecastChart({ points, height = 300 }: { points: ForecastPoint[]; height?: number }) {
  const t = useChartTheme();
  const data = points.map((p) => ({
    date: p.date,
    actual: p.actual ?? null,
    predicted: p.predicted ?? null,
    lower: p.lower ?? null,
    band: p.lower !== undefined && p.upper !== undefined ? p.upper - p.lower : null,
    upper: p.upper ?? null,
  }));
  const firstFuture = points.findIndex((p) => p.actual === undefined);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 8, right: 8, left: -6, bottom: 0 }}>
        <defs>
          <linearGradient id="fc-band" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={t.palette[1]} stopOpacity={0.25} />
            <stop offset="100%" stopColor={t.palette[1]} stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={t.grid} vertical={false} />
        <XAxis
          dataKey="date" tick={{ fill: t.text, fontSize: 11 }} tickLine={false} axisLine={{ stroke: t.axis }}
          tickFormatter={(v) => shortDate(String(v))} minTickGap={30}
        />
        <YAxis tick={{ fill: t.text, fontSize: 11 }} tickLine={false} axisLine={false} width={54} tickFormatter={(v) => fmtInt(Number(v))} />
        <Tooltip content={<ChartTooltip format={(v) => fmtInt(v)} />} />
        {firstFuture > 0 && (
          <ReferenceLine
            x={points[firstFuture - 1]?.date}
            stroke={t.palette[6]}
            strokeDasharray="4 4"
            label={{ value: 'forecast →', fill: t.text, fontSize: 10, position: 'insideTopRight' }}
          />
        )}
        <Area dataKey="lower" stackId="b" stroke="none" fill="transparent" isAnimationActive={false} name="lower" />
        <Area dataKey="band" stackId="b" stroke="none" fill="url(#fc-band)" isAnimationActive={false} name="confidence band" />
        <Line dataKey="actual" name="Actual" stroke={t.palette[0]} strokeWidth={2.2} dot={false} connectNulls={false} isAnimationActive={false} />
        <Line dataKey="predicted" name="Forecast" stroke={t.palette[1]} strokeWidth={2.2} strokeDasharray="6 4" dot={false} connectNulls={false} isAnimationActive={false} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

import { ReactNode } from 'react';
import { TooltipProps } from 'recharts';

export interface TipPayloadItem {
  name?: string | number;
  value?: number | string | Array<number | string>;
  color?: string;
  dataKey?: string | number;
}

/** Shared premium tooltip for all Recharts visualizations. */
export function ChartTooltip({ active, payload, label, format }: TooltipProps<number, string> & { format?: (v: number) => string }) {
  if (!active || !payload?.length) return null;
  const labelText = String(label ?? '');
  const displayLabel = /^\d{4}-\d{2}-\d{2}/.test(labelText)
    ? new Date(`${labelText.slice(0, 10)}T00:00:00Z`).toLocaleDateString('en', { month: 'short', day: 'numeric', timeZone: 'UTC' })
    : labelText;
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
        maxWidth: 260,
      }}
    >
      {label !== undefined && label !== null && (
        <div className="eyebrow" style={{ marginBottom: 6 }}>{displayLabel}</div>
      )}
      <div style={{ display: 'grid', gap: 4 }}>
        {payload.map((p, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-2)' }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: p.color ?? p.stroke ?? 'var(--accent)' }} />
              {p.name}
            </span>
            <span className="tabular" style={{ fontWeight: 700 }}>
              {format && typeof p.value === 'number' ? format(p.value) : String(p.value ?? '—')}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CenterLabel({ title, sub }: { title: ReactNode; sub?: ReactNode }) {
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'grid', placeContent: 'center', textAlign: 'center', pointerEvents: 'none' }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.45rem', fontWeight: 700 }}>{title}</div>
      {sub && <div className="faint" style={{ fontSize: 'var(--fs-xs)', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

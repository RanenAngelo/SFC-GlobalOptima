import { ReactNode } from 'react';
import { Priority, PerformanceClass } from '../../api/types';
import { titleCase } from '../../utils/format';

export function PriorityBadge({ priority }: { priority: Priority }) {
  const map: Record<Priority, { bg: string; fg: string; label: string }> = {
    critical: { bg: 'var(--danger-soft)', fg: 'var(--danger)', label: 'Critical' },
    high: { bg: 'var(--warn-soft)', fg: 'var(--warn)', label: 'High' },
    medium: { bg: 'var(--info-soft)', fg: 'var(--info)', label: 'Medium' },
    low: { bg: 'var(--surface-2)', fg: 'var(--text-3)', label: 'Low' },
  };
  const s = map[priority];
  return (
    <span className="chip" style={{ background: s.bg, color: s.fg, borderColor: 'transparent', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.fg }} />
      {s.label}
    </span>
  );
}

export function ClassBadge({ value }: { value: PerformanceClass | string }) {
  const map: Record<string, { fg: string; bg: string }> = {
    profit_driver: { fg: 'var(--success)', bg: 'var(--success-soft)' },
    volume_driver: { fg: 'var(--chart-2)', bg: 'var(--accent-2-soft)' },
    hidden_opportunity: { fg: 'var(--accent)', bg: 'var(--accent-soft)' },
    low_performer: { fg: 'var(--danger)', bg: 'var(--danger-soft)' },
    Profit: { fg: 'var(--success)', bg: 'var(--success-soft)' },
    Volume: { fg: 'var(--chart-2)', bg: 'var(--accent-2-soft)' },
    Hidden: { fg: 'var(--accent)', bg: 'var(--accent-soft)' },
    Low: { fg: 'var(--danger)', bg: 'var(--danger-soft)' },
  };
  const key = Object.keys(map).find((k) => value.toLowerCase().startsWith(k.toLowerCase())) ?? 'profit_driver';
  const s = map[key];
  const label = String(value)
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
  return (
    <span className="chip" style={{ background: s.bg, color: s.fg, borderColor: 'transparent', fontWeight: 700 }}>
      {label}
    </span>
  );
}

export function StatusDot({ status }: { status: 'ok' | 'low' | 'critical' | 'running' | 'queued' | 'succeeded' | 'failed' }) {
  const color =
    status === 'ok' || status === 'succeeded' ? 'var(--success)'
      : status === 'low' || status === 'running' || status === 'queued' ? 'var(--warn)'
      : 'var(--danger)';
  return <span aria-hidden style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block', boxShadow: `0 0 8px ${color}` }} />;
}

export function MatchBadge({ match }: { match: boolean }) {
  return match
    ? <span className="chip success">MATCH</span>
    : <span className="chip danger">MISMATCH</span>;
}

/** Step 41 — simulated output must be clearly labelled as an estimate. */
export function EstimateChip() {
  return (
    <span className="chip warn" title="Simulated estimate — not an actual result">
      ESTIMATE · SIMULATED
    </span>
  );
}

export function DeltaPill({ value, suffix = '%', invertGood = false, dp = 1 }: { value: number; suffix?: string; invertGood?: boolean; dp?: number }) {
  const good = invertGood ? value <= 0 : value >= 0;
  return (
    <span className={`chip ${good ? 'success' : 'danger'}`}>
      {value > 0 ? '+' : ''}{value.toFixed(dp)}{suffix}
    </span>
  );
}

export function Chip({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'accent' | 'success' | 'warn' | 'danger' | 'info' }) {
  return <span className={tone === 'neutral' ? 'chip' : `chip ${tone}`}>{children}</span>;
}

export function SevChip({ severity }: { severity: Priority }) {
  return <PriorityBadge priority={severity} />;
}

export { titleCase };

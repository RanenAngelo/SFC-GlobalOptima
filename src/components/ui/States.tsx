import { ReactNode } from 'react';
import { AlertTriangle, Inbox, RefreshCw, WifiOff } from 'lucide-react';

export function Skeleton({ h = 16, w = '100%', r, style }: { h?: number | string; w?: number | string; r?: number; style?: React.CSSProperties }) {
  return <div className="skeleton" style={{ height: h, width: w, borderRadius: r, ...style }} />;
}

export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} h={12} w={i === lines - 1 ? '60%' : '100%'} />
      ))}
    </div>
  );
}

export function ChartSkeleton({ height = 240 }: { height?: number }) {
  return (
    <div style={{ height, display: 'flex', alignItems: 'flex-end', gap: 8, padding: '8px 0' }}>
      {Array.from({ length: 14 }, (_, i) => (
        <Skeleton key={i} style={{ flex: 1, height: `${28 + ((i * 37) % 62)}%`, borderRadius: '6px 6px 2px 2px' }} />
      ))}
    </div>
  );
}

export function KpiSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-4" style={{ gap: 16 }}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="panel panel-pad">
          <Skeleton h={11} w="46%" />
          <Skeleton h={28} w="68%" style={{ marginTop: 12 }} />
          <Skeleton h={10} w="36%" style={{ marginTop: 10 }} />
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ message = 'No data available for this selection.', hint }: { message?: string; hint?: string }) {
  return (
    <div role="status" style={{ display: 'grid', placeItems: 'center', gap: 8, padding: '42px 20px', textAlign: 'center' }}>
      <div style={{
        width: 46, height: 46, borderRadius: 14, display: 'grid', placeItems: 'center',
        background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-3)',
      }}>
        <Inbox size={20} />
      </div>
      <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-2)', fontWeight: 600 }}>{message}</p>
      {hint && <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-3)', maxWidth: 380 }}>{hint}</p>}
    </div>
  );
}

export function ErrorState({ message = 'Unable to load this analysis.', onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div role="alert" style={{ display: 'grid', placeItems: 'center', gap: 10, padding: '42px 20px', textAlign: 'center' }}>
      <div style={{
        width: 46, height: 46, borderRadius: 14, display: 'grid', placeItems: 'center',
        background: 'var(--danger-soft)', color: 'var(--danger)', border: '1px solid transparent',
      }}>
        <AlertTriangle size={20} />
      </div>
      <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-1)', fontWeight: 600 }}>{message}</p>
      <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-3)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <WifiOff size={12} /> Check the data connection or try again.
      </p>
      {onRetry && (
        <button className="btn btn-sm" onClick={onRetry}>
          <RefreshCw size={13} /> Retry
        </button>
      )}
    </div>
  );
}

export function InlineBadge({ tone = 'neutral', children }: { tone?: 'neutral' | 'success' | 'warn' | 'danger' | 'info' | 'accent'; children: ReactNode }) {
  const cls = tone === 'neutral' ? 'chip' : `chip ${tone}`;
  return <span className={cls}>{children}</span>;
}

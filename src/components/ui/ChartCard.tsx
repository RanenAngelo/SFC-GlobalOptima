import { ReactNode, useEffect, useState } from 'react';
import { Panel } from './Panel';
import { ChartSkeleton, EmptyState, ErrorState } from './States';
import { useSettings } from '../../hooks/useSettings';

export interface ChartTheme {
  grid: string;
  text: string;
  axis: string;
  tooltipBg: string;
  tooltipBorder: string;
  palette: string[];
}

function readVar(name: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

export function useChartTheme(): ChartTheme {
  const { resolvedTheme, density } = useSettings();
  const [theme, setTheme] = useState<ChartTheme>(() => ({
    grid: 'rgba(255,255,255,0.07)', text: '#636f8a', axis: 'rgba(255,255,255,0.18)',
    tooltipBg: 'rgba(4,5,8,0.99)', tooltipBorder: 'rgba(255,255,255,0.12)',
    palette: ['#d9a441', '#5b8cff', '#3ecf8e', '#b48efc', '#f0715c', '#4cc9f0', '#f5a524', '#f274b7'],
  }));

  useEffect(() => {
    const palette = Array.from({ length: 8 }, (_, i) => readVar(`--chart-${i + 1}`, '#888'));
    setTheme({
      grid: readVar('--chart-grid', 'rgba(128,128,128,0.1)'),
      text: readVar('--text-3', '#6d7893'),
      axis: readVar('--border-strong', 'rgba(128,128,128,0.25)'),
      tooltipBg: readVar('--chart-tooltip-bg', 'rgba(255,255,255,0.95)'),
      tooltipBorder: readVar('--border', 'rgba(128,128,128,0.15)'),
      palette,
    });
  }, [resolvedTheme, density]);

  return theme;
}

interface ChartCardProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  height?: number;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  empty?: boolean;
  emptyMessage?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function ChartCard({
  title, subtitle, actions, height = 260,
  loading, error, onRetry, empty, emptyMessage, children, footer,
}: ChartCardProps) {
  return (
    <Panel
      title={title}
      subtitle={subtitle}
      actions={actions}
      pad={false}
      style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}
    >
      <div style={{ padding: '4px 6px 6px', flex: 1 }}>
        <div style={{ position: 'relative', minHeight: height }}>
          {loading ? (
            <ChartSkeleton height={height} />
          ) : error ? (
            <ErrorState message={error} onRetry={onRetry} />
          ) : empty ? (
            <EmptyState message={emptyMessage} />
          ) : (
            <div style={{ height }}>{children}</div>
          )}
        </div>
        {footer && !loading && !error && <div style={{ marginTop: 10, padding: '0 6px 8px' }}>{footer}</div>}
      </div>
    </Panel>
  );
}

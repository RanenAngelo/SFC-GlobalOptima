import { useMemo, useState, ReactNode } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Download } from 'lucide-react';
import { EmptyState, ErrorState, Skeleton } from './States';
import { csvEscape, downloadText, toCsv } from '../../utils/format';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  /** value used for sorting & CSV export */
  value: (row: T) => string | number;
  align?: 'left' | 'right';
  width?: number | string;
  sortable?: boolean;
  hideOnMobile?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  rowKey: (row: T) => string;
  pageSize?: number;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  exportName?: string;
  canExport?: boolean;
  /** Optional grouping order that stays primary when users sort another column. */
  primarySort?: (a: T, b: T) => number;
  /** Stable default ordering and tie-breaker for secondary sorts. */
  defaultSort?: (a: T, b: T) => number;
}

export function DataTable<T>({
  columns, rows, loading, error, onRetry, rowKey,
  pageSize = 10, onRowClick, emptyMessage, exportName, canExport = false, primarySort, defaultSort,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);

  const sorted = useMemo(() => {
    const col = columns.find((c) => c.key === sortKey);
    if (!col) {
      if (!primarySort && !defaultSort) return rows;
      return [...rows].sort((a, b) => (primarySort?.(a, b) ?? 0) || (defaultSort?.(a, b) ?? 0));
    }
    const mult = sortDir === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => {
      const primary = primarySort?.(a, b) ?? 0;
      if (primary !== 0) return primary;
      const av = col.value(a);
      const bv = col.value(b);
      const comparison = typeof av === 'number' && typeof bv === 'number'
        ? av - bv
        : String(av).localeCompare(String(bv));
      return comparison !== 0 ? comparison * mult : (defaultSort?.(a, b) ?? 0);
    });
  }, [rows, sortKey, sortDir, columns, primarySort, defaultSort]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const current = Math.min(page, pageCount);
  const slice = sorted.slice((current - 1) * pageSize, current * pageSize);

  const toggleSort = (key: string) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('desc'); }
    setPage(1);
  };

  if (loading) {
    return (
      <div style={{ display: 'grid', gap: 10, padding: 4 }}>
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} h={34} />
        ))}
      </div>
    );
  }
  if (error) return <ErrorState message={error} onRetry={onRetry} />;
  if (!rows.length) return <EmptyState message={emptyMessage ?? 'No data available for this selection.'} />;

  const doExport = () => {
    const header = columns.map((c) => csvEscape(c.header)).join(',');
    const body = sorted.map((r) => columns.map((c) => csvEscape(c.value(r))).join(',')).join('\n');
    downloadText(`${exportName ?? 'dineiq-export'}.csv`, `${header}\n${body}`);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
        {canExport && exportName && (
          <button className="btn btn-sm" onClick={doExport} title="Export CSV">
            <Download size={13} /> Export CSV
          </button>
        )}
      </div>
      <div style={{ overflowX: 'auto', margin: '0 -4px' }}>
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={c.sortable !== false ? 'sortable' : ''}
                  style={{ textAlign: c.align ?? 'left', width: c.width }}
                  onClick={() => c.sortable !== false && toggleSort(c.key)}
                  aria-sort={sortKey === c.key ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    {c.header}
                    {sortKey === c.key && (sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slice.map((r) => (
              <tr key={rowKey(r)} className={onRowClick ? 'clickable' : ''} onClick={() => onRowClick?.(r)}>
                {columns.map((c) => (
                  <td key={c.key} style={{ textAlign: c.align ?? 'left' }}>{c.render ? c.render(r) : c.value(r)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, gap: 12, flexWrap: 'wrap' }}>
        <span className="faint" style={{ fontSize: 'var(--fs-xs)' }}>
          {sorted.length.toLocaleString()} rows · page {current} / {pageCount}
        </span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn btn-sm" disabled={current <= 1} onClick={() => setPage(current - 1)} aria-label="Previous page">
            <ChevronLeft size={14} />
          </button>
          <button className="btn btn-sm" disabled={current >= pageCount} onClick={() => setPage(current + 1)} aria-label="Next page">
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

export { toCsv };

/** Formatting helpers shared across the UI. */

export function fmtCurrency(v: number, dp = 0): string {
  if (Number.isNaN(v)) return '—';
  const abs = Math.abs(v);
  if (abs >= 1e7) return `₨ ${(v / 1e7).toFixed(2)} Cr`;
  if (abs >= 1e5) return `₨ ${(v / 1e5).toFixed(2)} L`;
  return `₨ ${v.toLocaleString('en-PK', { maximumFractionDigits: dp })}`;
}

export function fmtCompact(v: number): string {
  if (Number.isNaN(v)) return '—';
  const abs = Math.abs(v);
  if (abs >= 1e9) return `${(v / 1e9).toFixed(2)}B`;
  if (abs >= 1e7) return `${(v / 1e7).toFixed(2)}Cr`;
  if (abs >= 1e5) return `${(v / 1e5).toFixed(2)}L`;
  if (abs >= 1e3) return `${(v / 1e3).toFixed(1)}K`;
  return v.toLocaleString();
}

export function fmtInt(v: number): string {
  if (Number.isNaN(v)) return '—';
  return Math.round(v).toLocaleString('en-PK');
}

export function fmtPct(v: number, dp = 1): string {
  if (Number.isNaN(v)) return '—';
  return `${v > 0 ? '+' : ''}${v.toFixed(dp)}%`;
}

export function fmtPctPlain(v: number, dp = 1): string {
  if (Number.isNaN(v)) return '—';
  return `${v.toFixed(dp)}%`;
}

export function fmtNum(v: number, dp = 1): string {
  if (Number.isNaN(v)) return '—';
  return v.toLocaleString('en-PK', { minimumFractionDigits: dp, maximumFractionDigits: dp });
}

export function fmtDate(iso: string): string {
  const d = new Date(iso + (iso.length === 10 ? 'T00:00:00Z' : ''));
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function shortDate(iso: string): string {
  const d = new Date(iso + (iso.length === 10 ? 'T00:00:00Z' : ''));
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

export function titleCase(s: string): string {
  return s.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function csvEscape(v: unknown): string {
  const s = v === null || v === undefined ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(rows: Record<string, unknown>[]): string {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(',')];
  for (const r of rows) lines.push(headers.map((h) => csvEscape(r[h])).join(','));
  return lines.join('\n');
}

export function downloadText(filename: string, content: string, mime = 'text/csv;charset=utf-8') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 800);
}

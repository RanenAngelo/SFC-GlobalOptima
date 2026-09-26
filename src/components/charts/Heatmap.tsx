import { useMemo, useState } from 'react';
import { useSettings } from '../../hooks/useSettings';

interface Cell { row: number; col: number; value: number; label?: string }

/**
 * Operational-intensity heatmap (Step 19 peak analysis, wastage dims).
 * Custom grid — crisp, lightweight, accessible via title tooltips.
 */
export function Heatmap({
  data, rowLabels, colLabels, format = (v: number) => String(v), height = 260, colorName = '--accent',
}: {
  data: Cell[];
  rowLabels: string[];
  colLabels: string[];
  format?: (v: number) => string;
  height?: number;
  colorName?: string;
}) {
  const [hover, setHover] = useState<Cell | null>(null);
  const { resolvedTheme } = useSettings();
  const max = useMemo(() => Math.max(1, ...data.map((d) => d.value)), [data]);
  const grid = useMemo(() => {
    const m = new Map<string, Cell>();
    data.forEach((d) => m.set(`${d.row}:${d.col}`, d));
    return m;
  }, [data]);

  const accent = useMemo(
    () => getComputedStyle(document.documentElement).getPropertyValue(colorName).trim() || '#d9a441',
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [colorName, resolvedTheme],
  );

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'grid', gridTemplateColumns: `auto repeat(${colLabels.length}, minmax(14px, 1fr))`, gap: 3, height, alignItems: 'stretch' }}>
        <div />
        {colLabels.map((c) => (
          <div key={c} className="faint" style={{ fontSize: 9, textAlign: 'center', alignSelf: 'end', paddingBottom: 4 }}>{c}</div>
        ))}
        {rowLabels.map((rl, r) => (
          <div key={rl} style={{ display: 'contents' }}>
            <div className="faint" style={{ fontSize: 10, display: 'flex', alignItems: 'center', paddingRight: 6, justifyContent: 'flex-end' }}>{rl}</div>
            {colLabels.map((_, c) => {
              const cell = grid.get(`${r}:${c}`);
              const v = cell?.value ?? 0;
              const a = 0.06 + (v / max) * 0.9;
              return (
                <div
                  key={c}
                  title={cell ? `${rl} · ${colLabels[c]} — ${format(v)}` : undefined}
                  onMouseEnter={() => cell && setHover(cell)}
                  onMouseLeave={() => setHover(null)}
                  style={{
                    borderRadius: 4,
                    background: v ? `color-mix(in srgb, ${accent} ${(a * 100).toFixed(0)}%, transparent)` : 'var(--surface-1)',
                    border: `1px solid ${hover && cell && hover.row === cell.row && hover.col === cell.col ? 'var(--border-strong)' : 'transparent'}`,
                    transition: 'border-color 120ms',
                    cursor: v ? 'help' : 'default',
                    minHeight: 14,
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, marginTop: 10 }}>
        <span className="faint" style={{ fontSize: 10 }}>low</span>
        <div style={{ width: 110, height: 8, borderRadius: 4, background: `linear-gradient(90deg, color-mix(in srgb, ${accent} 8%, transparent), ${accent})` }} />
        <span className="faint" style={{ fontSize: 10 }}>high</span>
        {hover && <span className="chip" style={{ marginLeft: 8 }}>{format(hover.value)}</span>}
      </div>
    </div>
  );
}

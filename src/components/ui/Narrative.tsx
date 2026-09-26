import { ReactNode } from 'react';
import { ChevronRight, Lightbulb, PlayCircle, Waves } from 'lucide-react';
import { NarrativeBlock, Priority } from '../../api/types';

const toneFor = (p?: Priority): { fg: string; bg: string } =>
  p === 'critical' ? { fg: 'var(--danger)', bg: 'var(--danger-soft)' }
    : p === 'high' ? { fg: 'var(--warn)', bg: 'var(--warn-soft)' }
    : p === 'medium' ? { fg: 'var(--info)', bg: 'var(--info-soft)' }
    : { fg: 'var(--accent)', bg: 'var(--accent-soft)' };

export function AnalyticNarrative({ narrative, compact = false }: { narrative?: NarrativeBlock | null; compact?: boolean }) {
  if (!narrative) return null;
  const tone = toneFor(narrative.severity);

  const rows: { icon: ReactNode; label: string; text: string }[] = [
    { icon: <Waves size={13} />, label: 'What happened', text: narrative.happened },
    { icon: <Lightbulb size={13} />, label: 'Why it happened', text: narrative.why },
    { icon: <PlayCircle size={13} />, label: 'What to do next', text: narrative.next },
  ];

  return (
    <div className="panel" style={{ overflow: 'hidden' }}>
      <div style={{ padding: '11px 18px', borderBottom: '1px solid var(--panel-header-border, var(--border))', background: tone.bg, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ display: 'block', width: 3, height: 12, borderRadius: 2, background: tone.fg, flexShrink: 0 }} />
        <span className="eyebrow" style={{ color: tone.fg, fontSize: 10 }}>Analytic insight</span>
      </div>
      <div style={{ padding: '16px 18px 18px', display: 'grid', gap: compact ? 10 : 14 }}>
        {rows.map((r) => (
          <div key={r.label} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 12, alignItems: 'start' }}>
            <span style={{
              width: 28, height: 28, borderRadius: 8, display: 'grid', placeItems: 'center',
              background: tone.bg, color: tone.fg, flexShrink: 0,
            }}>
              {r.icon}
            </span>
            <div>
              <div className="eyebrow" style={{ marginBottom: 3, fontSize: 10 }}>{r.label}</div>
              <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-2)', lineHeight: 1.5 }}>{r.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SectionHeader({ eyebrow, title, desc, right }: { eyebrow: string; title: string; desc?: string; right?: ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, marginBottom: 7 }}>
          <span style={{ display: 'block', width: 3, height: 14, borderRadius: 2, background: 'var(--accent)', flexShrink: 0 }} />
          <span className="eyebrow" style={{ fontSize: 10.5 }}>{eyebrow}</span>
        </div>
        <h1 style={{ fontSize: 'var(--fs-h1)', letterSpacing: '-0.03em', fontWeight: 720 }}>{title}</h1>
        {desc && <p className="muted" style={{ marginTop: 7, maxWidth: 680, fontSize: 'var(--fs-sm)', lineHeight: 1.55 }}>{desc}</p>}
      </div>
      {right && <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>{right}</div>}
    </div>
  );
}

export function StatRow({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18 }}>
      {items.map((it) => (
        <div key={it.label}>
          <div className="eyebrow">{it.label}</div>
          <div className="tabular" style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 680 }}>{it.value}</div>
        </div>
      ))}
    </div>
  );
}

export function NextArrow() {
  return <ChevronRight size={14} style={{ color: 'var(--text-3)' }} />;
}

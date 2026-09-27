import { useState } from 'react';
import { CheckCircle2, ListChecks, Target } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { DineIQApi } from '../api/DineIQApi';
import { Panel } from '../components/ui/Panel';
import { AnalyticNarrative, SectionHeader } from '../components/ui/Narrative';
import { KpiTile, Reveal } from '../components/ui/Motion';
import { PriorityBadge, Chip } from '../components/ui/Badges';
import { Recommendation } from '../api/types';
import { useSettings } from '../hooks/useSettings';

const CAT_ICON: Record<string, string> = {
  menu: '🍽', inventory: '📦', pricing: '💰', promotion: '📣',
  customer: '👥', location: '📍', operations: '⚙️',
};

function RecCard({ rec }: { rec: Recommendation }) {
  const [open, setOpen] = useState(false);
  const border =
    rec.priority === 'critical' ? 'var(--danger)'
      : rec.priority === 'high' ? 'var(--warn)'
      : 'var(--border)';

  return (
    <article className="panel" style={{ padding: 18, borderTop: `2px solid ${border}`, display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', gap: 10, minWidth: 0 }}>
          <span aria-hidden style={{ fontSize: 18 }}>{CAT_ICON[rec.category] ?? '•'}</span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 'var(--fs-sm)', lineHeight: 1.4 }}>{rec.action}</div>
            <div className="faint" style={{ fontSize: 10.5, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              {rec.category}{rec.relatedEntity ? ` · ${rec.relatedEntity}` : ''}
            </div>
          </div>
        </div>
        <PriorityBadge priority={rec.priority} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <button className="btn btn-sm btn-ghost" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
          <ListChecks size={13} /> {open ? 'Hide evidence' : `Evidence (${rec.reason.length})`}
        </button>
        <span className="chip" style={{ marginLeft: 'auto' }}>
          <Target size={11} /> {rec.impactEstimate}
        </span>
      </div>

      {open && (
        <ul style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 6, fontSize: 'var(--fs-sm)', color: 'var(--text-2)' }}>
          {rec.reason.map((r) => <li key={r}>{r}</li>)}
        </ul>
      )}

      <div className="faint" style={{ fontSize: 10.5, display: 'flex', alignItems: 'center', gap: 6 }}>
        <CheckCircle2 size={11} style={{ color: 'var(--success)' }} />
        Every recommendation carries analytical evidence — no unexplained actions.
      </div>
    </article>
  );
}

export default function RecommendationsPage() {
  const rec = useApi((f) => DineIQApi.getRecommendations(f));
  const [prio, setPrio] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all');
  const { notifyAnomalies } = useSettings();

  const items = (rec.data?.items ?? []).filter((r) => prio === 'all' || r.priority === prio);
  const counts = rec.data?.byPriority;

  return (
    <div>
      <SectionHeader
        eyebrow="Intelligence · Decision Support"
        title="Recommendations"
        desc="Evidence-based, prioritized management actions generated from the analytical modules."
        right={
          <div style={{ display: 'inline-flex', gap: 6 }}>
            {(['all', 'critical', 'high', 'medium', 'low'] as const).map((p) => (
              <button key={p} className={`btn btn-sm ${prio === p ? 'btn-primary' : ''}`} onClick={() => setPrio(p)} style={{ textTransform: 'capitalize' }}>
                {p}{p !== 'all' && counts ? ` · ${counts[p]}` : ''}
              </button>
            ))}
          </div>
        }
      />

      <Reveal>
        <div className="grid grid-4" style={{ marginBottom: 16 }}>
          <KpiTile label="Critical" value={counts?.critical ?? 0} format={(v) => Math.round(v)} foot="act immediately" accent />
          <KpiTile label="High priority" value={counts?.high ?? 0} format={(v) => Math.round(v)} foot="this week" />
          <KpiTile label="Medium" value={counts?.medium ?? 0} format={(v) => Math.round(v)} foot="next cycle" />
          <KpiTile label="Low" value={counts?.low ?? 0} format={(v) => Math.round(v)} foot="when convenient" />
        </div>
      </Reveal>

      {!notifyAnomalies && (
        <div className="chip warn" style={{ marginBottom: 14 }}>Notification preference: anomaly signals muted in Settings.</div>
      )}

      {rec.status === 'loading' ? (
        <div className="grid grid-2">
          {Array.from({ length: 6 }, (_, i) => <div key={i} className="skeleton" style={{ height: 190 }} />)}
        </div>
      ) : rec.status === 'error' ? (
        <Panel><p className="muted">Unable to load this analysis. <button className="btn btn-sm" onClick={rec.reload}>Retry</button></p></Panel>
      ) : items.length === 0 ? (
        <Panel><p className="muted" style={{ textAlign: 'center', padding: 30 }}>No data available for this selection.</p></Panel>
      ) : (
        <div className="grid grid-2" style={{ alignItems: 'start' }}>
          {items.map((r) => <RecCard key={r.id} rec={r} />)}
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        <AnalyticNarrative narrative={rec.data?.narrative} />
      </div>

      <div className="chip info" style={{ marginTop: 14 }}>
        Priorities assigned by potential business impact.
      </div>
    </div>
  );
}

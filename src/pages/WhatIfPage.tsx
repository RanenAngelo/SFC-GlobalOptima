import { FormEvent, useState } from 'react';
import { FlaskConical, Info, Play } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { DineIQApi } from '../api/DineIQApi';
import { Panel } from '../components/ui/Panel';
import { AnalyticNarrative, SectionHeader } from '../components/ui/Narrative';
import { EstimateChip } from '../components/ui/Badges';
import { useFilters } from '../hooks/useFilters';
import { WhatIfAction, WhatIfImpact } from '../api/types';
import { fmtPct } from '../utils/format';

const ACTIONS: { id: WhatIfAction; label: string; hint: string; magnitudeLabel: string; min: number; max: number }[] = [
  { id: 'price_increase', label: 'Increase menu price', hint: 'Raise price on a target item', magnitudeLabel: 'Price increase %', min: 1, max: 25 },
  { id: 'price_decrease', label: 'Reduce item price', hint: 'Cut price on a target item', magnitudeLabel: 'Price decrease %', min: 1, max: 25 },
  { id: 'discount_change', label: 'Change discount percentage', hint: 'Adjust discount depth', magnitudeLabel: 'Discount change (pts)', min: 1, max: 30 },
  { id: 'promotion_frequency', label: 'Increase promotion frequency', hint: 'Run campaigns more often', magnitudeLabel: 'Frequency increase %', min: 5, max: 100 },
  { id: 'remove_item', label: 'Remove a menu item', hint: 'Delist from the menu', magnitudeLabel: 'Share of demand affected %', min: 1, max: 40 },
  { id: 'prep_reduction', label: 'Reduce preparation quantity', hint: 'Prepare less of an item', magnitudeLabel: 'Prep reduction %', min: 5, max: 60 },
  { id: 'demand_increase', label: 'Increase predicted demand', hint: 'Assume higher forward demand', magnitudeLabel: 'Demand increase %', min: 5, max: 80 },
  { id: 'wastage_assumption', label: 'Change wastage assumption', hint: 'Shift assumed wastage rate', magnitudeLabel: 'Wastage change %', min: 1, max: 50 },
];

const IMPACT_ROWS: { key: keyof WhatIfImpact; label: string }[] = [
  { key: 'revenue', label: 'Revenue' },
  { key: 'contributionMargin', label: 'Contribution margin' },
  { key: 'demand', label: 'Demand' },
  { key: 'wastage', label: 'Wastage' },
  { key: 'profitability', label: 'Profitability' },
];

export default function WhatIfPage() {
  const { filters } = useFilters();
  const menu = useApi((f) => DineIQApi.getMenuAnalytics(f));

  const [action, setAction] = useState<WhatIfAction>('price_increase');
  const [itemId, setItemId] = useState('');
  const [magnitude, setMagnitude] = useState(5);
  const [result, setResult] = useState<WhatIfImpact | null>(null);
  const [busy, setBusy] = useState(false);

  const cfg = ACTIONS.find((a) => a.id === action)!;
  const needsItem = ['price_increase', 'price_decrease', 'remove_item', 'prep_reduction'].includes(action);
  const itemName = menu.data?.items.find((i) => i.id === itemId)?.name;

  const run = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const impact = await DineIQApi.simulateScenario(
        { action, magnitudePct: magnitude, targetItemId: itemId || undefined, targetItemName: itemName },
        filters,
      );
      setResult(impact);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <SectionHeader
        eyebrow="Operations · Scenario Simulation"
        title="What-If Simulator"
        desc="Simulate pricing, promotion, demand and preparation changes. Outputs are clearly marked as estimates — never actual results."
        right={<EstimateChip />}
      />

      <div className="grid grid-2" style={{ alignItems: 'start' }}>
        <Panel
          title={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><FlaskConical size={16} style={{ color: 'var(--accent)' }} /> Scenario builder</span>}
          subtitle="Select a lever, a target and a magnitude"
        >
          <form onSubmit={run} style={{ display: 'grid', gap: 16 }}>
            <label className="field">
              Scenario action
              <select className="select" value={action} onChange={(e) => {
                const next = e.target.value as WhatIfAction;
                setAction(next);
                const c = ACTIONS.find((a) => a.id === next)!;
                setMagnitude(Math.round((c.min + c.max) / 3));
                setResult(null);
              }}>
                {ACTIONS.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
              </select>
            </label>

            <p className="faint" style={{ fontSize: 11.5, marginTop: -8 }}>{cfg.hint}</p>

            {needsItem && (
              <label className="field">
                Target menu item
                <select className="select" value={itemId} onChange={(e) => { setItemId(e.target.value); setResult(null); }} required>
                  <option value="">Select an item…</option>
                  {(menu.data?.items ?? []).map((i) => <option key={i.id} value={i.id}>{i.name} · {i.category}</option>)}
                </select>
              </label>
            )}

            <label className="field">
              {cfg.magnitudeLabel} — <span className="tabular" style={{ color: 'var(--accent)', fontSize: 13 }}>{magnitude}{cfg.id.includes('discount') ? ' pts' : '%'}</span>
              <input
                type="range" min={cfg.min} max={cfg.max} value={magnitude}
                onChange={(e) => { setMagnitude(Number(e.target.value)); setResult(null); }}
                style={{ width: '100%', accentColor: 'var(--accent)', marginTop: 6 }}
              />
              <span className="faint" style={{ fontSize: 10.5, textTransform: 'none', letterSpacing: 0 }}>
                {cfg.min}% … {cfg.max}%{cfg.id.includes('discount') ? ' pts' : ''}
              </span>
            </label>

            <button className="btn btn-primary" disabled={busy || (needsItem && !itemId)} style={{ padding: '11px 16px' }}>
              {busy ? <span className="spinner" style={{ borderTopColor: 'var(--accent-contrast)' }} /> : <Play size={15} />}
              {busy ? 'Simulating…' : 'Run simulation'}
            </button>
          </form>
        </Panel>

        <div style={{ display: 'grid', gap: 16 }}>
          <Panel
            title="Estimated impact"
            subtitle="Simulated outputs vs current baseline"
            actions={<EstimateChip />}
            style={result ? { borderColor: 'var(--warn-soft)' } : undefined}
          >
            {!result ? (
              <div style={{ display: 'grid', placeItems: 'center', gap: 10, padding: '38px 16px', textAlign: 'center' }}>
                <div style={{ width: 46, height: 46, borderRadius: 14, display: 'grid', placeItems: 'center', background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-3)' }}>
                  <Info size={20} />
                </div>
                <p className="muted" style={{ fontSize: 'var(--fs-sm)', fontWeight: 600 }}>Build a scenario and run the simulation.</p>
                <p className="faint" style={{ fontSize: 11, maxWidth: 320 }}>
                  Results will be marked as ESTIMATES derived from historical structure — not actual outcomes.
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 14 }}>
                <div className="grid grid-2">
                  {IMPACT_ROWS.map((row) => {
                    const v = result[row.key] as number;
                    const good = row.key === 'wastage' ? v <= 0 : v >= 0;
                    return (
                       <div key={row.key} className="panel" style={{ padding: 14 }}>
                        <div className="eyebrow" style={{ fontSize: 9 }}>{row.label}</div>
                        <div className="tabular" style={{
                          fontFamily: 'var(--font-display)', fontSize: '1.55rem', fontWeight: 700, marginTop: 4,
                          color: good ? 'var(--success)' : 'var(--danger)',
                        }}>
                          {fmtPct(v)}
                        </div>
                        <div className="faint" style={{ fontSize: 10, marginTop: 2 }}>estimated delta</div>
                      </div>
                    );
                  })}
                </div>

                <div>
                  <div className="eyebrow" style={{ marginBottom: 8 }}>Model notes</div>
                  <ul style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 6, fontSize: 'var(--fs-sm)', color: 'var(--text-2)' }}>
                    {result.notes.map((n) => <li key={n}>{n}</li>)}
                  </ul>
                </div>

                <div className="chip warn" style={{ whiteSpace: 'normal', textAlign: 'left', padding: 10 }}>
                  These figures are <b>simulated estimates</b> for planning discussion only. Actual outcomes depend on execution and market response.
                </div>
              </div>
            )}
          </Panel>

          <AnalyticNarrative
            narrative={{
              happened: 'Scenario modelling runs against historical elasticity, margin and basket structure for the filtered scope.',
              why: 'Simulation engine applies dynamic price elasticity (-1.2 coefficient) and volume sensitivity across filtered dishes to project net profit impact.',
              next: 'Compare multiple magnitudes, pick the knee of the curve, then validate with a real controlled experiment.',
              severity: 'medium',
            }}
            compact
          />
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { AlertOctagon, Tag } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { DineIQApi } from '../api/DineIQApi';
import { Panel } from '../components/ui/Panel';
import { ChartCard } from '../components/ui/ChartCard';
import { AnalyticNarrative, SectionHeader } from '../components/ui/Narrative';
import { KpiTile, Reveal } from '../components/ui/Motion';
import { DataTable, Column } from '../components/ui/DataTable';
import { Chip, DeltaPill, PriorityBadge } from '../components/ui/Badges';
import { Drawer } from '../components/ui/Drawer';
import { useAuth } from '../hooks/useAuth';
import { PriceSensitivityRow, PromotionRow } from '../api/types';
import { fmtCurrency, fmtDate, fmtPctPlain, titleCase } from '../utils/format';

const SENS_TONE = { high: 'danger', moderate: 'warn', low: 'success' } as const;

export default function PricingPage() {
  const [tab, setTab] = useState<'pricing' | 'promotions'>('pricing');
  const [item, setItem] = useState<PriceSensitivityRow | null>(null);
  const [promo, setPromo] = useState<PromotionRow | null>(null);
  const { canExport } = useAuth();

  const pr = useApi((f) => DineIQApi.getPricingAnalytics(f));
  const pm = useApi((f) => DineIQApi.getPromotionAnalytics(f));

  const priceCols: Column<PriceSensitivityRow>[] = [
    { key: 'name', header: 'Item', value: (r) => r.name, render: (r) => <span style={{ fontWeight: 650 }}>{r.name}</span> },
    { key: 'price', header: 'Price', value: (r) => r.price, align: 'right', render: (r) => <span className="tabular">{fmtCurrency(r.price)}</span> },
    { key: 'prev', header: 'Prev price', value: (r) => r.prevPrice, align: 'right', render: (r) => <span className="tabular faint">{fmtCurrency(r.prevPrice)}</span> },
    { key: 'elast', header: 'Elasticity', value: (r) => r.elasticity, align: 'right',
      render: (r) => <span className="tabular">{r.elasticity.toFixed(2)}</span> },
    { key: 'sens', header: 'Sensitivity', value: (r) => r.sensitivity, render: (r) => <Chip tone={SENS_TONE[r.sensitivity]}>{titleCase(r.sensitivity)}</Chip> },
    { key: 'demand', header: 'Demand Δ after price change', value: (r) => r.demandChangeAfterPriceChangePct, align: 'right',
      render: (r) => <DeltaPill value={r.demandChangeAfterPriceChangePct} invertGood /> },
    { key: 'margin', header: 'Margin %', value: (r) => r.marginPct, align: 'right', render: (r) => <span className="tabular">{fmtPctPlain(r.marginPct)}</span> },
  ];

  const promoCols: Column<PromotionRow>[] = [
    { key: 'name', header: 'Promotion', value: (r) => r.name,
      render: (r) => (
        <div>
          <div style={{ fontWeight: 650 }}>{r.name}</div>
          <div className="faint" style={{ fontSize: 10.5 }}>{r.type} · {fmtDate(r.start)} → {fmtDate(r.end)}</div>
        </div>
      ) },
    { key: 'rev', header: 'Revenue Δ', value: (r) => r.revenueLiftPct, align: 'right', render: (r) => <DeltaPill value={r.revenueLiftPct} /> },
    { key: 'margin', header: 'Margin Δ', value: (r) => r.marginChangePct, align: 'right', render: (r) => <DeltaPill value={r.marginChangePct} invertGood /> },
    { key: 'orders', header: 'Orders Δ', value: (r) => r.orderVolumeLiftPct, align: 'right', render: (r) => <DeltaPill value={r.orderVolumeLiftPct} /> },
    { key: 'new', header: 'New customers', value: (r) => r.newCustomers, align: 'right', render: (r) => <span className="tabular">{r.newCustomers.toLocaleString()}</span> },
    { key: 'waste', header: 'Wastage Δ', value: (r) => r.wastageChangePct, align: 'right', render: (r) => <DeltaPill value={r.wastageChangePct} invertGood /> },
    { key: 'ret', header: 'Post-promo retention', value: (r) => r.postPromoRetentionPct, align: 'right', render: (r) => <span className="tabular">{fmtPctPlain(r.postPromoRetentionPct)}</span> },
    { key: 'eff', header: 'Verdict', value: (r) => r.effectiveness,
      render: (r) => <Chip tone={r.effectiveness === 'effective' ? 'success' : r.effectiveness === 'mixed' ? 'warn' : 'danger'}>{r.effectiveness}</Chip> },
    { key: 'traps', header: 'Traps', value: (r) => r.traps.length, align: 'right',
      render: (r) => r.traps.length > 0 ? <span className="chip danger">{r.traps.length}</span> : <span className="faint">—</span> },
  ];

  const traps = pm.data?.trapsDetected ?? [];

  return (
    <div>
      <SectionHeader
        eyebrow="Intelligence · Elasticity & Promos"
        title="Pricing & Promotions"
        desc="Price-sensitivity classification, repricing candidates and promotion effectiveness — sales lift alone never proves success."
        right={
          <div style={{ display: 'inline-flex', gap: 6 }}>
            <button className={`btn btn-sm ${tab === 'pricing' ? 'btn-primary' : ''}`} onClick={() => setTab('pricing')}>Pricing</button>
            <button className={`btn btn-sm ${tab === 'promotions' ? 'btn-primary' : ''}`} onClick={() => setTab('promotions')}>Promotions</button>
          </div>
        }
      />

      {tab === 'pricing' ? (
        <>
          <Reveal>
            <div className="grid grid-4" style={{ marginBottom: 16 }}>
              <KpiTile label="Price-demand correlation" value={pr.data?.priceDemandCorrelation ?? 0} format={(v) => v.toFixed(2)} foot="negative = demand falls as price rises" accent />
              <KpiTile label="Highly sensitive" value={(pr.data?.items ?? []).filter((i) => i.sensitivity === 'high').length} format={(v) => Math.round(v)} foot="handle with care" />
              <KpiTile label="Moderate" value={(pr.data?.items ?? []).filter((i) => i.sensitivity === 'moderate').length} format={(v) => Math.round(v)} foot="test incrementally" />
              <KpiTile label="Low sensitivity" value={(pr.data?.items ?? []).filter((i) => i.sensitivity === 'low').length} format={(v) => Math.round(v)} foot="repricing headroom" />
            </div>
          </Reveal>

          <Reveal>
            <Panel title="Price sensitivity matrix" subtitle="Elasticity from historical price-change windows" pad={false}
              actions={<Chip tone="accent"><Tag size={11} /> click a row for price history</Chip>}>
              <div style={{ padding: '4px 16px 16px' }}>
                <DataTable
                  columns={priceCols} rows={pr.data?.items ?? []}
                  loading={pr.status === 'loading'} error={pr.status === 'error' ? pr.error : null}
                  onRetry={pr.reload} rowKey={(r) => r.id} pageSize={10}
                  onRowClick={setItem}
                  exportName="dineiq-price-sensitivity" canExport={canExport}
                />
              </div>
            </Panel>
          </Reveal>

          <div className="grid grid-2" style={{ marginTop: 16 }}>
            <Reveal>
              <Panel title="Repricing candidates" subtitle="Low sensitivity + below-parity margin">
                {(pr.data?.repricingCandidates ?? []).length === 0 && pr.status === 'ready'
                  ? <p className="muted" style={{ padding: 16 }}>No data available for this selection.</p>
                  : (pr.data?.repricingCandidates ?? []).map((c) => (
                    <div key={c.id} className="panel" style={{ padding: 12, marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
                        <b>{c.name}</b>
                        <span className="chip success">est +{c.estImpactPct}% margin</span>
                      </div>
                      <p className="muted" style={{ fontSize: 11.5, marginTop: 6 }}>{c.suggestion}</p>
                    </div>
                  ))}
                {pr.status === 'loading' && Array.from({ length: 3 }, (_, i) => <div key={i} className="skeleton" style={{ height: 64, marginBottom: 10 }} />)}
              </Panel>
            </Reveal>
            <Reveal delay={0.05}>
              <AnalyticNarrative narrative={pr.data?.narrative} />
            </Reveal>
          </div>
        </>
      ) : (
        <>
          <Reveal>
            <div className="grid grid-4" style={{ marginBottom: 16 }}>
              <KpiTile label="Campaigns evaluated" value={pm.data?.promotions.length ?? 0} format={(v) => Math.round(v)} foot="multi-metric scoring" accent />
              <KpiTile label="Promotion traps" value={traps.length} format={(v) => Math.round(v)} foot="sales up, profit down & friends" />
              <KpiTile label="Ineffective" value={(pm.data?.promotions ?? []).filter((p) => p.effectiveness === 'ineffective').length} format={(v) => Math.round(v)} foot="redesign or retire" />
              <KpiTile label="Effective" value={(pm.data?.promotions ?? []).filter((p) => p.effectiveness === 'effective').length} format={(v) => Math.round(v)} foot="margin-safe lift" />
            </div>
          </Reveal>

          {traps.length > 0 && (
            <Reveal>
              <Panel title={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><AlertOctagon size={16} style={{ color: 'var(--danger)' }} /> Promotion trap detection</span>}
                subtitle="Misleading promotions identified"
                actions={<Chip tone="danger">{traps.length} traps</Chip>}
                style={{ borderColor: 'var(--danger-soft)' }}>
                <div className="grid grid-2">
                  {traps.slice(0, 6).map((t, i) => (
                    <div key={i} className="panel" style={{ padding: 12, background: 'var(--danger-soft)', border: 'transparent' }}>
                      <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 700 }}>{t.trap.kind}</div>
                      <div className="muted" style={{ fontSize: 11.5, marginTop: 4 }}>{t.trap.detail}</div>
                      <div className="chip" style={{ marginTop: 8 }}>{t.promotion}</div>
                    </div>
                  ))}
                </div>
              </Panel>
            </Reveal>
          )}

          <Reveal>
            <Panel title="Promotion effectiveness" subtitle="Revenue, margin, acquisition, wastage, retention — multi-metric weighted" style={{ marginTop: 16 }} pad={false}>
              <div style={{ padding: '4px 16px 16px' }}>
                <DataTable
                  columns={promoCols} rows={pm.data?.promotions ?? []}
                  loading={pm.status === 'loading'} error={pm.status === 'error' ? pm.error : null}
                  onRetry={pm.reload} rowKey={(r) => r.id} pageSize={8}
                  onRowClick={setPromo}
                  exportName="dineiq-promotions" canExport={canExport}
                />
              </div>
            </Panel>
          </Reveal>

          <div style={{ marginTop: 16 }}>
            <AnalyticNarrative narrative={pm.data?.narrative} />
          </div>
        </>
      )}

      {/* drill-downs */}
      <Drawer open={!!item} onClose={() => setItem(null)} title={item?.name ?? ''} subtitle="Price history & sensitivity detail">
        {item && (
          <div style={{ display: 'grid', gap: 14 }}>
            <div className="grid grid-2">
              <div className="panel" style={{ padding: 12 }}><div className="eyebrow" style={{ fontSize: 9 }}>Current price</div><b className="tabular">{fmtCurrency(item.price)}</b></div>
              <div className="panel" style={{ padding: 12 }}><div className="eyebrow" style={{ fontSize: 9 }}>Previous</div><b className="tabular faint">{fmtCurrency(item.prevPrice)}</b></div>
              <div className="panel" style={{ padding: 12 }}><div className="eyebrow" style={{ fontSize: 9 }}>Elasticity</div><b className="tabular">{item.elasticity.toFixed(2)}</b></div>
              <div className="panel" style={{ padding: 12 }}><div className="eyebrow" style={{ fontSize: 9 }}>Sensitivity</div><Chip tone={SENS_TONE[item.sensitivity]}>{titleCase(item.sensitivity)}</Chip></div>
            </div>
            <div>
              <div className="eyebrow" style={{ marginBottom: 8 }}>Price history</div>
              <div style={{ display: 'grid', gap: 6 }}>
                {item.priceHistory.map((p) => (
                  <div key={p.date} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, paddingBottom: 6, borderBottom: '1px solid var(--border)' }}>
                    <span className="faint">{fmtDate(p.date)}</span>
                    <span className="tabular" style={{ fontWeight: 650 }}>{fmtCurrency(p.price)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Drawer>

      <Drawer open={!!promo} onClose={() => setPromo(null)} title={promo?.name ?? ''} subtitle={promo ? `${promo.type} · ${fmtDate(promo.start)} → ${fmtDate(promo.end)}` : ''}>
        {promo && (
          <div style={{ display: 'grid', gap: 14 }}>
            <div className="grid grid-2">
              {[
                ['Revenue Δ', `${promo.revenueLiftPct}%`],
                ['Margin Δ', `${promo.marginChangePct}%`],
                ['Orders Δ', `${promo.orderVolumeLiftPct}%`],
                ['AOV Δ', `${promo.aovChangePct}%`],
                ['New customers', promo.newCustomers.toLocaleString()],
                ['Repeat rate', fmtPctPlain(promo.repeatRatePct)],
                ['Wastage Δ', `${promo.wastageChangePct}%`],
                ['Post-promo retention', fmtPctPlain(promo.postPromoRetentionPct)],
              ].map(([k, v]) => (
                <div key={k} className="panel" style={{ padding: 12 }}>
                  <div className="eyebrow" style={{ fontSize: 9 }}>{k}</div>
                  <b className="tabular">{v}</b>
                </div>
              ))}
            </div>
            <div>
              <div className="eyebrow" style={{ marginBottom: 8 }}>Detected traps</div>
              {promo.traps.length === 0 ? <Chip tone="success">No traps detected</Chip> : (
                <div style={{ display: 'grid', gap: 8 }}>
                  {promo.traps.map((t) => (
                    <div key={t.id} className="panel" style={{ padding: 10, background: 'var(--danger-soft)', border: 'transparent' }}>
                      <b style={{ fontSize: 12 }}>{t.kind}</b>
                      <p className="muted" style={{ fontSize: 11.5, marginTop: 3 }}>{t.detail}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <div className="eyebrow" style={{ marginBottom: 6 }}>Verdict</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Chip tone={promo.effectiveness === 'effective' ? 'success' : promo.effectiveness === 'mixed' ? 'warn' : 'danger'}>{promo.effectiveness}</Chip>
                <PriorityBadge priority={promo.effectiveness === 'ineffective' ? 'critical' : promo.effectiveness === 'mixed' ? 'medium' : 'low'} />
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}

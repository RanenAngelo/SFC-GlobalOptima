import { useState } from 'react';
import { Flag, Search } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { DineIQApi } from '../api/DineIQApi';
import { Panel } from '../components/ui/Panel';
import { ChartCard } from '../components/ui/ChartCard';
import { AnalyticNarrative, SectionHeader } from '../components/ui/Narrative';
import { KpiTile, Reveal } from '../components/ui/Motion';
import { QuadrantScatter, resolveClassColor } from '../components/charts/ScatterCharts';
import { DataTable, Column } from '../components/ui/DataTable';
import { ClassBadge, Chip } from '../components/ui/Badges';
import { Drawer } from '../components/ui/Drawer';
import { useAuth } from '../hooks/useAuth';
import { CLASS_LABELS } from '../data/mock/catalog';
import { MenuItemPerformance, SlowMovingItem } from '../api/types';
import { fmtCurrency, fmtInt, fmtPctPlain, titleCase } from '../utils/format';

function FactorBar({ f }: { f: { name: string; value: number; weight: number } }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, alignItems: 'center', marginBottom: 8 }}>
      <div>
        <div style={{ fontSize: 11.5, display: 'flex', justifyContent: 'space-between' }}>
          <span>{f.name}</span>
          <span className="faint">weight {Math.round(f.weight * 100)}%</span>
        </div>
        <div className="skeleton" style={{ height: 6, borderRadius: 4, marginTop: 4, background: 'var(--surface-2)' }}>
          <div style={{ width: `${f.value}%`, height: '100%', borderRadius: 4, background: f.value > 66 ? 'var(--danger)' : f.value > 40 ? 'var(--warn)' : 'var(--success)' }} />
        </div>
      </div>
      <span className="tabular" style={{ fontSize: 12, fontWeight: 700, width: 30, textAlign: 'right' }}>{Math.round(f.value)}</span>
    </div>
  );
}

const CLASS_ORDER: Record<MenuItemPerformance['classification'], number> = {
  profit_driver: 1,
  volume_driver: 2,
  hidden_opportunity: 3,
  low_performer: 4,
};

const compareMenuClass = (a: MenuItemPerformance, b: MenuItemPerformance) =>
  CLASS_ORDER[a.classification] - CLASS_ORDER[b.classification];

const compareMenuName = (a: MenuItemPerformance, b: MenuItemPerformance) =>
  a.name.localeCompare(b.name);

export default function MenuPage() {
  const [selected, setSelected] = useState<MenuItemPerformance | null>(null);
  const [smQuery, setSmQuery] = useState('');
  const { canExport } = useAuth();

  const menu = useApi((f) => DineIQApi.getMenuAnalytics(f));
  const slow = useApi((f) => DineIQApi.getSlowMovingItems(f));

  const items = menu.data?.items ?? [];
  const counts = menu.data?.counts;

  const maxQty = Math.max(1, ...items.map((i) => i.quantitySold));
  const maxProfit = Math.max(1, ...items.map((i) => i.profitPct));

  const cols: Column<MenuItemPerformance>[] = [
    { key: 'name', header: 'Item', value: (r) => r.name,
      render: (r) => (
        <div>
          <div style={{ fontWeight: 650 }}>{r.flags.length > 0 && <Flag size={11} style={{ color: 'var(--warn)', display: 'inline', marginRight: 5 }} />}{r.name}</div>
          <div className="faint" style={{ fontSize: 10.5 }}>{r.id} · {r.category}</div>
        </div>
      ) },
    { key: 'class', header: 'Class', value: (r) => r.classification, render: (r) => <ClassBadge value={r.classification} /> },
    { key: 'qty', header: 'Qty sold', value: (r) => r.quantitySold, align: 'right', render: (r) => <span className="tabular">{fmtInt(r.quantitySold)}</span> },
    { key: 'rev', header: 'Revenue', value: (r) => r.revenue, align: 'right', render: (r) => <span className="tabular">{fmtCurrency(r.revenue)}</span> },
    { key: 'margin', header: 'Margin %', value: (r) => r.profitPct, align: 'right',
      render: (r) => <span className="tabular" style={{ color: r.profitPct < 15 ? 'var(--danger)' : undefined }}>{fmtPctPlain(r.profitPct)}</span> },
    { key: 'rating', header: 'Rating', value: (r) => r.rating, align: 'right', render: (r) => <span className="tabular">★ {r.rating.toFixed(1)}</span> },
    { key: 'repeat', header: 'Repeat %', value: (r) => r.repeatPurchaseRate, align: 'right', render: (r) => <span className="tabular">{fmtPctPlain(r.repeatPurchaseRate)}</span> },
    { key: 'waste', header: 'Wastage %', value: (r) => r.wastagePct, align: 'right',
      render: (r) => <Chip tone={r.wastagePct > 8 ? 'danger' : r.wastagePct > 5 ? 'warn' : 'success'}>{fmtPctPlain(r.wastagePct)}</Chip> },
    { key: 'promo', header: 'Promo dep. %', value: (r) => r.promotionDependency, align: 'right', render: (r) => <span className="tabular">{fmtPctPlain(r.promotionDependency)}</span> },
    { key: 'trend', header: 'Trend', value: (r) => r.salesTrendPct, align: 'right',
      render: (r) => <Chip tone={r.salesTrendPct >= 0 ? 'success' : 'danger'}>{r.salesTrendPct >= 0 ? '+' : ''}{r.salesTrendPct}%</Chip> },
  ];

  const slowRows = (slow.data ?? []).filter((s) => !smQuery || s.name.toLowerCase().includes(smQuery.toLowerCase()));

  return (
    <div>
      <SectionHeader
        eyebrow="Intelligence · Menu Engineering"
        title="Menu Intelligence"
        desc="Every item classified on 10 dimensions — volume alone never qualifies an item as successful."
        right={<span className="chip accent">{items.length} items in view</span>}
      />

      <Reveal>
        <div className="grid grid-4" style={{ marginBottom: 16 }}>
          <KpiTile label="Profit Drivers" value={counts?.profit_driver ?? 0} format={fmtInt} foot="high demand · high profit" accent />
          <KpiTile label="Volume Drivers" value={counts?.volume_driver ?? 0} format={fmtInt} foot="demand-heavy, thinner margin" />
          <KpiTile label="Hidden Opportunities" value={counts?.hidden_opportunity ?? 0} format={fmtInt} foot="good margins, low visibility" />
          <KpiTile label="Low Performers" value={counts?.low_performer ?? 0} format={fmtInt} foot="redesign or delist" />
        </div>
      </Reveal>

      <div className="grid grid-2" style={{ marginBottom: 16 }}>
        <Reveal>
          <ChartCard
            title="Classification quadrant" subtitle="Demand vs profitability — data-driven, multi-indicator"
            loading={menu.status === 'loading'} error={menu.status === 'error' ? menu.error : null} onRetry={menu.reload}
            empty={items.length === 0}
            height={346}
            footer={
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {(['profit_driver', 'volume_driver', 'hidden_opportunity', 'low_performer'] as const).map((c) => (
                  <span key={c} className="chip">
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: resolveClassColor(c) }} />
                    {CLASS_LABELS[c]}
                  </span>
                ))}
              </div>
            }
          >
            <QuadrantScatter
              points={items.map((i) => ({
                x: (i.quantitySold / maxQty) * 100,
                y: (i.profitPct / maxProfit) * 100,
                label: i.name,
                extra: `${CLASS_LABELS[i.classification]} · qty ${fmtInt(i.quantitySold)} · margin ${fmtPctPlain(i.profitPct)}`,
                cls: i.classification,
              }))}
            />
          </ChartCard>
        </Reveal>

        <Reveal delay={0.05}>
          <Panel
            title="Slow-moving dishes" subtitle="Composite of 7 core performance factors"
            actions={
              <div style={{ position: 'relative' }}>
                <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
                <input className="input" style={{ paddingLeft: 30, width: 160, height: 34 }} placeholder="Filter…" value={smQuery} onChange={(e) => setSmQuery(e.target.value)} />
              </div>
            }
          >
            {slow.status === 'loading' ? (
              <div style={{ display: 'grid', gap: 10 }}>{Array.from({ length: 5 }, (_, i) => <div key={i} className="skeleton" style={{ height: 64 }} />)}</div>
            ) : slowRows.length === 0 ? (
              <p className="muted" style={{ padding: 20, textAlign: 'center' }}>No data available for this selection.</p>
            ) : (
              <div style={{ display: 'grid', gap: 12, maxHeight: 420, overflowY: 'auto', paddingRight: 4 }}>
                {slowRows.map((s: SlowMovingItem) => (
                  <div key={s.id} className="panel" style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
                      <div>
                        <span style={{ fontWeight: 650, fontSize: 'var(--fs-sm)' }}>{s.name}</span>
                        <span className="faint" style={{ fontSize: 11, marginLeft: 8 }}>{s.category}</span>
                      </div>
                      <span className={`chip ${s.compositeScore >= 70 ? 'danger' : s.compositeScore >= 50 ? 'warn' : 'neutral'}`}>
                        score {s.compositeScore}
                      </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                      {s.factors.slice(0, 4).map((f) => <FactorBar key={f.name} f={f} />)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </Reveal>
      </div>

      <Reveal>
        <Panel title="Menu item performance" subtitle="Sortable · paginated · click a row to drill down" pad={false}
          actions={<Chip tone="info">10 indicators per item</Chip>}>
          <div style={{ padding: '4px 16px 16px' }}>
            <DataTable
              columns={cols} rows={items}
            primarySort={compareMenuClass} defaultSort={compareMenuName}
              loading={menu.status === 'loading'} error={menu.status === 'error' ? menu.error : null}
              onRetry={menu.reload} rowKey={(r) => r.id} pageSize={10}
              onRowClick={setSelected}
              exportName="dineiq-menu-performance" canExport={canExport}
            />
          </div>
        </Panel>
      </Reveal>

      <div style={{ marginTop: 16 }}>
        <AnalyticNarrative narrative={menu.data?.narrative} />
      </div>

      <Drawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.name ?? ''}
        subtitle={selected ? `${selected.id} · ${selected.category} · ${titleCase(selected.classification)}` : ''}
      >
        {selected && (
          <div style={{ display: 'grid', gap: 14 }}>
            <div className="grid grid-2">
              {[
                ['Quantity sold', fmtInt(selected.quantitySold)],
                ['Revenue', fmtCurrency(selected.revenue)],
                ['Cost', fmtCurrency(selected.cost)],
                ['Contribution margin', fmtCurrency(selected.contributionMargin)],
                ['Profit %', fmtPctPlain(selected.profitPct)],
                ['Rating', `★ ${selected.rating.toFixed(1)} (${fmtInt(selected.ratingCount)})`],
                ['Repeat purchase', fmtPctPlain(selected.repeatPurchaseRate)],
                ['Wastage %', fmtPctPlain(selected.wastagePct)],
                ['Promotion dependency', fmtPctPlain(selected.promotionDependency)],
                ['Sales trend', `${selected.salesTrendPct >= 0 ? '+' : ''}${selected.salesTrendPct}%`],
              ].map(([k, v]) => (
                <div key={k} className="panel" style={{ padding: '10px 12px' }}>
                  <div className="eyebrow" style={{ fontSize: 9 }}>{k}</div>
                  <div className="tabular" style={{ fontWeight: 700, marginTop: 3 }}>{v}</div>
                </div>
              ))}
            </div>

            <div>
              <div className="eyebrow" style={{ marginBottom: 8 }}>Classification</div>
              <ClassBadge value={selected.classification} />
            </div>

            <div>
              <div className="eyebrow" style={{ marginBottom: 8 }}>Operational flags</div>
              {selected.flags.length === 0 ? (
                <span className="faint" style={{ fontSize: 12 }}>No flagged edge cases.</span>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {selected.flags.map((f) => <Chip key={f} tone="warn">{f}</Chip>)}
                </div>
              )}
            </div>

            <div className="chip" style={{ alignItems: 'flex-start', lineHeight: 1.5, whiteSpace: 'normal', padding: 10 }}>
              Classification blends volume, revenue, margin, rating, repeat purchase, wastage, promotion dependency and trend — not a single hard-coded field.
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}

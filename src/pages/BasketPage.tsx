import { useApi } from '../hooks/useApi';
import { DineIQApi } from '../api/DineIQApi';
import { Panel } from '../components/ui/Panel';
import { ChartCard } from '../components/ui/ChartCard';
import { AnalyticNarrative, SectionHeader } from '../components/ui/Narrative';
import { KpiTile, Reveal } from '../components/ui/Motion';
import { NetworkGraph } from '../components/charts/NetworkGraph';
import { DataTable, Column } from '../components/ui/DataTable';
import { Chip } from '../components/ui/Badges';
import { useAuth } from '../hooks/useAuth';
import { BasketRule, BundleSuggestion } from '../api/types';
import { fmtPctPlain } from '../utils/format';

export default function BasketPage() {
  const basket = useApi((f) => DineIQApi.getMarketBasketAnalytics(f));
  const { canExport } = useAuth();
  const data = basket.data;

  const ruleCols: Column<BasketRule>[] = [
    { key: 'id', header: 'Rule', value: (r) => r.id, render: (r) => <span className="mono" style={{ fontSize: 11 }}>{r.id}</span> },
    { key: 'ante', header: 'If bought', value: (r) => r.antecedent.join(', '),
      render: (r) => <span style={{ fontWeight: 600 }}>{r.antecedent.join(' + ')}</span> },
    { key: 'cons', header: 'Then likely', value: (r) => r.consequent.join(', '),
      render: (r) => <span style={{ fontWeight: 600, color: 'var(--accent)' }}>{r.consequent.join(' + ')}</span> },
    { key: 'support', header: 'Support', value: (r) => r.support, align: 'right', render: (r) => <span className="tabular">{r.support.toFixed(3)}</span> },
    { key: 'conf', header: 'Confidence', value: (r) => r.confidence, align: 'right',
      render: (r) => <span className="tabular">{fmtPctPlain(r.confidence * 100, 0)}</span> },
    { key: 'lift', header: 'Lift', value: (r) => r.lift, align: 'right',
      render: (r) => <span className={`chip ${r.lift >= 3 ? 'success' : r.lift >= 2 ? 'info' : 'neutral'}`}>{r.lift.toFixed(2)}×</span> },
  ];

  const bundleCols: Column<BundleSuggestion>[] = [
    { key: 'name', header: 'Bundle', value: (r) => r.name, render: (r) => <span style={{ fontWeight: 650 }}>{r.name}</span> },
    { key: 'type', header: 'Type', value: (r) => r.type, render: (r) => <Chip tone="accent">{r.type.replace('_', '-')}</Chip> },
    { key: 'items', header: 'Items', value: (r) => r.items.join(', '), render: (r) => <span className="faint" style={{ fontSize: 11 }}>{r.items.join(' · ')}</span> },
    { key: 'evidence', header: 'Evidence', value: (r) => r.evidence.lift,
      render: (r) => <span className="chip info">lift {r.evidence.lift}× · conf {fmtPctPlain(r.evidence.confidence * 100, 0)}</span> },
    { key: 'est', header: 'Est. uplift', value: (r) => r.estLiftPct, align: 'right', render: (r) => <span className="tabular" style={{ color: 'var(--success)' }}>+{r.estLiftPct}%</span> },
  ];

  const strong = (data?.rules ?? []).filter((r) => r.lift >= 2.5).length;

  return (
    <div>
      <SectionHeader
        eyebrow="Intelligence · Cross-Sell & Bundling"
        title="Market Basket Analysis"
        desc="Association rules with support / confidence / lift — every bundle recommendation is backed by rule evidence."
        right={<span className="chip accent">{strong} high-lift pairings</span>}
      />

      <Reveal>
        <div className="grid grid-4" style={{ marginBottom: 16 }}>
          <KpiTile label="Association rules" value={data?.rules.length ?? 0} format={(v) => Math.round(v)} foot="confidence ≥ 0.35" accent />
          <KpiTile label="Max lift" value={Math.max(0, ...(data?.rules ?? []).map((r) => r.lift))} format={(v) => `${v.toFixed(2)}×`} foot="vs independent purchase" />
          <KpiTile label="Bundle ideas" value={data?.bundles.length ?? 0} format={(v) => Math.round(v)} foot="combo · cross-sell · upsell" />
          <KpiTile label="Linked items" value={data?.network.nodes.length ?? 0} format={(v) => Math.round(v)} foot="in association graph" />
        </div>
      </Reveal>

      <div className="grid grid-2">
        <Reveal>
          <ChartCard title="Product relationship network" subtitle="Frequently purchased together — hover nodes to isolate pairings"
            loading={basket.status === 'loading'} error={basket.status === 'error' ? basket.error : null} onRetry={basket.reload}
            empty={!data || data.network.nodes.length === 0} height={360}>
            <NetworkGraph nodes={data?.network.nodes ?? []} links={data?.network.links ?? []} height={340} />
          </ChartCard>
        </Reveal>

        <Reveal delay={0.05}>
          <div style={{ display: 'grid', gap: 16, alignContent: 'start' }}>
            <Panel title="Bundle & cross-sell recommendations" subtitle="Supported by association-rule evidence" pad={false}>
              <div style={{ padding: '4px 16px 16px' }}>
                <DataTable
                  columns={bundleCols} rows={data?.bundles ?? []}
                  loading={basket.status === 'loading'} error={basket.status === 'error' ? basket.error : null}
                  onRetry={basket.reload} rowKey={(r) => r.id} pageSize={5}
                  exportName="dineiq-bundles" canExport={canExport}
                />
              </div>
            </Panel>
            <AnalyticNarrative narrative={data?.narrative} compact />
          </div>
        </Reveal>
      </div>

      <Reveal>
        <Panel title="Association rules" subtitle="Ranked by lift — the complete evidence base" style={{ marginTop: 16 }} pad={false}>
          <div style={{ padding: '4px 16px 16px' }}>
            <DataTable
              columns={ruleCols} rows={data?.rules ?? []}
              loading={basket.status === 'loading'} error={basket.status === 'error' ? basket.error : null}
              onRetry={basket.reload} rowKey={(r) => r.id} pageSize={8}
              exportName="dineiq-market-basket" canExport={canExport}
            />
          </div>
        </Panel>
      </Reveal>
    </div>
  );
}

import { useApi } from '../hooks/useApi';
import { DineIQApi } from '../api/DineIQApi';
import { Panel } from '../components/ui/Panel';
import { ChartCard } from '../components/ui/ChartCard';
import { AnalyticNarrative, SectionHeader } from '../components/ui/Narrative';
import { KpiTile, Reveal } from '../components/ui/Motion';
import { RankBars } from '../components/charts/BasicCharts';
import { DataTable, Column } from '../components/ui/DataTable';
import { ClassBadge, Chip } from '../components/ui/Badges';
import { ChannelPerformance, LocationPerformance, PerformanceClass } from '../api/types';
import { fmtCompact, fmtCurrency, fmtInt, fmtPctPlain } from '../utils/format';

export default function LocationsPage() {
  const loc = useApi((f) => DineIQApi.getLocationAnalytics(f));
  const data = loc.data;

  const cols: Column<LocationPerformance>[] = [
    { key: 'name', header: 'Location', value: (r) => r.name,
      render: (r) => (
        <div>
          <div style={{ fontWeight: 650 }}>{r.name}</div>
          <div className="faint" style={{ fontSize: 10.5 }}>{r.city}</div>
        </div>
      ) },
    { key: 'revenue', header: 'Revenue', value: (r) => r.revenue, align: 'right', render: (r) => <span className="tabular">{fmtCompact(r.revenue)}</span> },
    { key: 'margin', header: 'Margin %', value: (r) => r.marginPct, align: 'right',
      render: (r) => <Chip tone={r.marginPct >= 28 ? 'success' : r.marginPct >= 22 ? 'info' : 'warn'}>{fmtPctPlain(r.marginPct)}</Chip> },
    { key: 'aov', header: 'AOV', value: (r) => r.aov, align: 'right', render: (r) => <span className="tabular">{fmtCurrency(r.aov)}</span> },
    { key: 'customers', header: 'Customers', value: (r) => r.customers, align: 'right', render: (r) => <span className="tabular">{fmtInt(r.customers)}</span> },
    { key: 'repeat', header: 'Repeat %', value: (r) => r.repeatRatePct, align: 'right', render: (r) => <span className="tabular">{fmtPctPlain(r.repeatRatePct)}</span> },
    { key: 'wastage', header: 'Wastage %', value: (r) => r.wastagePct, align: 'right',
      render: (r) => <Chip tone={r.wastagePct > 7 ? 'danger' : r.wastagePct > 5 ? 'warn' : 'success'}>{fmtPctPlain(r.wastagePct)}</Chip> },
    { key: 'rating', header: 'Rating', value: (r) => r.rating, align: 'right', render: (r) => <span className="tabular">★ {r.rating.toFixed(1)}</span> },
    { key: 'promo', header: 'Promo order %', value: (r) => r.promoEffectivenessPct, align: 'right', render: (r) => <span className="tabular">{fmtPctPlain(r.promoEffectivenessPct)}</span> },
  ];

  const chCols: Column<ChannelPerformance>[] = [
    { key: 'ch', header: 'Channel', value: (r) => r.channel, render: (r) => <span style={{ fontWeight: 650 }}>{r.channel}</span> },
    { key: 'orders', header: 'Orders', value: (r) => r.orders, align: 'right', render: (r) => <span className="tabular">{fmtInt(r.orders)}</span> },
    { key: 'basket', header: 'Basket', value: (r) => r.basketSize, align: 'right', render: (r) => <span className="tabular">{r.basketSize}</span> },
    { key: 'aov', header: 'AOV', value: (r) => r.aov, align: 'right', render: (r) => <span className="tabular">{fmtCurrency(r.aov)}</span> },
    { key: 'disc', header: 'Discount %', value: (r) => r.discountPct, align: 'right', render: (r) => <span className="tabular">{fmtPctPlain(r.discountPct)}</span> },
    { key: 'margin', header: 'Margin %', value: (r) => r.marginPct, align: 'right', render: (r) => <span className="tabular">{fmtPctPlain(r.marginPct)}</span> },
    { key: 'peak', header: 'Peak hour', value: (r) => r.peakHour, align: 'right', render: (r) => <span className="tabular">{r.peakHour}:00</span> },
    { key: 'cats', header: 'Top categories', value: (r) => r.topCategories.join(', '), render: (r) => <span className="faint" style={{ fontSize: 11 }}>{r.topCategories.join(' · ')}</span> },
  ];

  const mixCols: Column<{ item: string; location: string; classification: PerformanceClass }>[] = [
    { key: 'item', header: 'Menu item', value: (r) => r.item, render: (r) => <span style={{ fontWeight: 600 }}>{r.item}</span> },
    { key: 'loc', header: 'Location', value: (r) => r.location },
    { key: 'cls', header: 'Class at this location', value: (r) => r.classification, render: (r) => <ClassBadge value={r.classification} /> },
  ];

  const top = data?.locations[0];

  return (
    <div>
      <SectionHeader
        eyebrow="Analytics · Multi-Branch Intelligence"
        title="Locations & Channels"
        desc="Multi-location intelligence, ordering-channel comparison and location-specific menu classification."
        right={<span className="chip accent">{data?.locations.length ?? 0} locations · {data?.channels.length ?? 0} channels in scope</span>}
      />

      <Reveal>
        <div className="grid grid-4" style={{ marginBottom: 16 }}>
          <KpiTile label="Top location" value={top ? top.name : '—'} foot={top ? fmtCompact(top.revenue) : ''} accent />
          <KpiTile label="Avg margin" value={data ? data.locations.reduce((s, l) => s + l.marginPct, 0) / Math.max(1, data.locations.length) : 0}
            format={(v) => fmtPctPlain(v)} foot="across locations" />
          <KpiTile label="Delivery orders" value={data?.channels.find((c) => c.channel === 'Third-Party Delivery')?.orders ?? 0}
            format={(v) => fmtInt(v)} foot="third-party platform" />
          <KpiTile label="Location-specific classes" value={data?.locationMenuClasses.length ?? 0}
            format={(v) => fmtInt(v)} foot="same item, different class" />
        </div>
      </Reveal>

      <Reveal>
        <Panel title="Location leaderboard" subtitle="Standardized performance indicators across branches" pad>
          <DataTable
            columns={cols} rows={data?.locations ?? []}
            loading={loc.status === 'loading'} error={loc.status === 'error' ? loc.error : null}
            onRetry={loc.reload} rowKey={(r) => r.id} pageSize={10}
            exportName="dineiq-location-performance"
          />
        </Panel>
      </Reveal>

      <div className="grid grid-2" style={{ marginTop: 16 }}>
        <Reveal>
          <ChartCard title="Revenue by location" subtitle="Top 12 branches"
            loading={loc.status === 'loading'} error={loc.status === 'error' ? loc.error : null} onRetry={loc.reload}
            empty={!data || data.locations.length === 0} height={330}>
            <RankBars data={(data?.locations ?? []).slice(0, 12).map((l) => ({ name: l.name, value: l.revenue }))}
              format={(v) => fmtCompact(v)} height={330} colorIndex={1} />
          </ChartCard>
        </Reveal>
        <Reveal delay={0.05}>
          <Panel title="Ordering channels" subtitle="Basket size, AOV, margin & peak demand by channel" pad={false}>
            <div style={{ padding: '4px 16px 16px' }}>
              <DataTable
                columns={chCols} rows={data?.channels ?? []}
                loading={loc.status === 'loading'} error={loc.status === 'error' ? loc.error : null}
                onRetry={loc.reload} rowKey={(r) => r.channel} pageSize={5}
                exportName="dineiq-channels"
              />
            </div>
          </Panel>
        </Reveal>
      </div>

      <Reveal>
        <Panel title="Location-specific menu performance" subtitle="The same dish can be a Profit Driver at one branch and a Low Performer at another" style={{ marginTop: 16 }} pad={false}>
          <div style={{ padding: '4px 16px 16px' }}>
            <DataTable
              columns={mixCols} rows={data?.locationMenuClasses ?? []}
              loading={loc.status === 'loading'} error={loc.status === 'error' ? loc.error : null}
              onRetry={loc.reload} rowKey={(r) => `${r.item}-${r.location}`} pageSize={8}
              exportName="dineiq-location-menu-classes"
            />
          </div>
        </Panel>
      </Reveal>

      <div style={{ marginTop: 16 }}>
        <AnalyticNarrative narrative={data?.narrative} />
      </div>
    </div>
  );
}

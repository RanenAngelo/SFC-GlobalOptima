import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { DineIQApi } from '../api/DineIQApi';
import { Panel } from '../components/ui/Panel';
import { ChartCard } from '../components/ui/ChartCard';
import { AnalyticNarrative, SectionHeader } from '../components/ui/Narrative';
import { KpiTile, Reveal } from '../components/ui/Motion';
import { Donut, RankBars, TrendChart } from '../components/charts/BasicCharts';
import { BasicScatter } from '../components/charts/ScatterCharts';
import { DataTable, Column } from '../components/ui/DataTable';
import { Chip, PriorityBadge } from '../components/ui/Badges';
import { Drawer } from '../components/ui/Drawer';
import { useAuth } from '../hooks/useAuth';
import { ChurnRiskRow, CustomerSegment, RfmRow } from '../api/types';
import { fmtCurrency, fmtInt, fmtPctPlain, titleCase } from '../utils/format';

export default function CustomersPage() {
  const cust = useApi((f) => DineIQApi.getCustomerAnalytics(f));
  const [seg, setSeg] = useState<CustomerSegment | null>(null);
  const { canExport } = useAuth();
  const data = cust.data;

  const segCols: Column<CustomerSegment>[] = [
    { key: 'name', header: 'Segment', value: (r) => r.name, render: (r) => <span style={{ fontWeight: 650 }}>{r.name}</span> },
    { key: 'customers', header: 'Customers', value: (r) => r.customers, align: 'right', render: (r) => <span className="tabular">{fmtInt(r.customers)}</span> },
    { key: 'share', header: 'Share %', value: (r) => r.sharePct, align: 'right', render: (r) => <span className="tabular">{fmtPctPlain(r.sharePct)}</span> },
    { key: 'rev', header: 'Revenue share %', value: (r) => r.revenueSharePct, align: 'right', render: (r) => <span className="tabular" style={{ color: 'var(--accent)' }}>{fmtPctPlain(r.revenueSharePct)}</span> },
    { key: 'mon', header: 'Avg monetary', value: (r) => r.avgMonetary, align: 'right', render: (r) => <span className="tabular">{fmtCurrency(r.avgMonetary)}</span> },
    { key: 'freq', header: 'Avg frequency', value: (r) => r.avgFrequency, align: 'right', render: (r) => <span className="tabular">{r.avgFrequency}</span> },
    { key: 'rec', header: 'Avg recency (d)', value: (r) => r.avgRecencyDays, align: 'right', render: (r) => <span className="tabular">{r.avgRecencyDays}</span> },
    { key: 'strat', header: 'Strategy', value: (r) => r.strategy, render: (r) => <span className="faint" style={{ fontSize: 11 }}>{r.strategy}</span> },
  ];

  const churnCols: Column<ChurnRiskRow>[] = [
    { key: 'id', header: 'Customer', value: (r) => r.customerId, render: (r) => <span className="mono" style={{ fontSize: 11.5 }}>{r.customerId}</span> },
    { key: 'risk', header: 'Churn risk', value: (r) => r.riskScore, align: 'right',
      render: (r) => (
        <span className={`chip ${r.riskScore >= 80 ? 'danger' : 'warn'}`}>{r.riskScore}</span>
      ) },
    { key: 'rec', header: 'Recency trend', value: (r) => r.recencyTrend, render: (r) => <span className="tabular">{r.recencyTrend}</span> },
    { key: 'freq', header: 'Frequency Δ', value: (r) => r.frequencyChangePct, align: 'right', render: (r) => <Chip tone="danger">{r.frequencyChangePct}%</Chip> },
    { key: 'mon', header: 'Monetary Δ', value: (r) => r.monetaryChangePct, align: 'right', render: (r) => <Chip tone="danger">{r.monetaryChangePct}%</Chip> },
    { key: 'div', header: 'Diversity Δ', value: (r) => r.categoryDiversityChangePct, align: 'right', render: (r) => <span className="tabular">{r.categoryDiversityChangePct}%</span> },
    { key: 'visits', header: 'Visits / mo', value: (r) => r.visitsPerMonth, align: 'right', render: (r) => <span className="tabular">{r.visitsPerMonth}</span> },
  ];

  const topCols: Column<RfmRow>[] = [
    { key: 'id', header: 'Customer', value: (r) => r.customerId, render: (r) => <span className="mono" style={{ fontSize: 11.5 }}>{r.customerId}</span> },
    { key: 'seg', header: 'Segment', value: (r) => r.segmentId, render: (r) => <Chip tone="accent">{titleCase(r.segmentId)}</Chip> },
    { key: 'r', header: 'R', value: (r) => r.rScore, align: 'right', render: (r) => <b>{r.rScore}</b> },
    { key: 'f', header: 'F', value: (r) => r.fScore, align: 'right', render: (r) => <b>{r.fScore}</b> },
    { key: 'm', header: 'M', value: (r) => r.mScore, align: 'right', render: (r) => <b>{r.mScore}</b> },
    { key: 'mon', header: 'Monetary', value: (r) => r.monetary, align: 'right', render: (r) => <span className="tabular">{fmtCurrency(r.monetary)}</span> },
    { key: 'freq', header: 'Frequency', value: (r) => r.frequency, align: 'right', render: (r) => <span className="tabular">{r.frequency}</span> },
    { key: 'rec', header: 'Recency (d)', value: (r) => r.recencyDays, align: 'right', render: (r) => <span className="tabular">{r.recencyDays}</span> },
  ];

  return (
    <div>
      <SectionHeader
        eyebrow="Intelligence · Customer Analytics"
        title="Customer Intelligence"
        desc="Behavioral segmentation, RFM scoring, churn-risk signals and targeting strategies."
        right={<span className="chip accent">{data ? fmtInt(data.rfm.rows.length) : '—'} RFM profiles in view</span>}
      />

      <Reveal>
        <div className="grid grid-4" style={{ marginBottom: 16 }}>
          <KpiTile label="Segments" value={data?.segments.length ?? 0} format={fmtInt} foot="behavioral groups" accent />
          <KpiTile label="High-value loyal" value={data?.segments.find((s) => s.name.includes('High'))?.customers ?? 0} format={fmtInt} foot={`${data?.segments.find((s) => s.name.includes('High'))?.revenueSharePct ?? 0}% of revenue`} />
          <KpiTile label="At-risk customers" value={data?.segments.find((s) => s.name.includes('At-Risk'))?.customers ?? 0} format={fmtInt} foot="engagement declining" />
          <KpiTile label="Churn-risk flagged" value={data?.churnRisk.length ?? 0} format={fmtInt} foot="top of list by risk score" />
        </div>
      </Reveal>

      <Reveal>
        <Panel title="Segment map" subtitle="Size = customers · click a row for targeting strategy" pad={false}>
          <div style={{ padding: '4px 16px 16px' }}>
            <DataTable
              columns={segCols} rows={data?.segments ?? []}
              loading={cust.status === 'loading'} error={cust.status === 'error' ? cust.error : null}
              onRetry={cust.reload} rowKey={(r) => r.id} pageSize={6}
              onRowClick={setSeg}
              exportName="dineiq-customer-segments" canExport={canExport}
            />
          </div>
        </Panel>
      </Reveal>

      <div className="grid grid-3" style={{ marginTop: 16 }}>
        <Reveal>
          <ChartCard title="Revenue share by segment" subtitle="Concentration of value"
            loading={cust.status === 'loading'} error={cust.status === 'error' ? cust.error : null} onRetry={cust.reload}
            empty={!data || data.segments.length === 0} height={260}>
            <Donut data={(data?.segments ?? []).map((s) => ({ name: s.name, value: s.revenueSharePct }))} height={260} format={(v) => `${v}%`} />
          </ChartCard>
        </Reveal>
        <Reveal delay={0.05}>
          <ChartCard title="RFM distribution" subtitle="Customers by score band"
            loading={cust.status === 'loading'} error={cust.status === 'error' ? cust.error : null} onRetry={cust.reload}
            empty={!data || data.rfm.bins.length === 0} height={260}>
            <RankBars data={(data?.rfm.bins ?? []).map((b) => ({ name: b.label, value: b.count }))} format={(v) => fmtInt(v)} height={260} colorIndex={3} />
          </ChartCard>
        </Reveal>
        <Reveal delay={0.1}>
          <ChartCard title="RFM matrix" subtitle="Frequency × monetary · size = recency pressure"
            loading={cust.status === 'loading'} error={cust.status === 'error' ? cust.error : null} onRetry={cust.reload}
            empty={!data || data.rfm.rows.length === 0} height={306}>
            <BasicScatter
              points={(data?.rfm.rows ?? []).map((r) => ({
                x: r.frequency, y: r.monetary / 1000, label: r.customerId,
                extra: `R${r.rScore} F${r.fScore} M${r.mScore} · recency ${r.recencyDays}d`,
              }))}
              xLabel="Frequency" yLabel="Monetary (K)"
            />
          </ChartCard>
        </Reveal>
      </div>

      <div className="grid grid-2" style={{ marginTop: 16 }}>
        <Reveal>
          <Panel title="Churn-risk customers" subtitle="Rising recency, falling frequency & spend" pad={false}>
            <div style={{ padding: '4px 16px 16px' }}>
              <DataTable
                columns={churnCols} rows={data?.churnRisk ?? []}
                loading={cust.status === 'loading'} error={cust.status === 'error' ? cust.error : null}
                onRetry={cust.reload} rowKey={(r) => r.customerId} pageSize={6}
                exportName="dineiq-churn-risk" canExport={canExport}
              />
            </div>
          </Panel>
        </Reveal>
        <Reveal delay={0.05}>
          <div style={{ display: 'grid', gap: 16 }}>
            <ChartCard title="Customer trends" subtitle="Active · new · repeat · churned"
              loading={cust.status === 'loading'} error={cust.status === 'error' ? cust.error : null} onRetry={cust.reload}
              empty={!data || data.trends.length === 0} height={220}>
              <TrendChart data={(data?.trends ?? []) as never[]} xKey="date" showLegend
                series={[
                  { key: 'active', name: 'Active' },
                  { key: 'new', name: 'New', color: 'var(--chart-3)' },
                  { key: 'repeat', name: 'Repeat', color: 'var(--chart-4)' },
                ]}
                format={(v) => fmtInt(v)} />
            </ChartCard>

            <Panel title="Top customers by monetary value" pad={false}>
              <div style={{ padding: '4px 16px 16px' }}>
                <DataTable
                  columns={topCols} rows={data?.topCustomers ?? []}
                  loading={cust.status === 'loading'} error={cust.status === 'error' ? cust.error : null}
                  onRetry={cust.reload} rowKey={(r) => r.customerId} pageSize={5}
                  exportName="dineiq-top-customers" canExport={canExport}
                />
              </div>
            </Panel>
          </div>
        </Reveal>
      </div>

      <div style={{ marginTop: 16 }}>
        <AnalyticNarrative narrative={data?.narrative} />
      </div>

      <Drawer open={!!seg} onClose={() => setSeg(null)} title={seg?.name ?? ''} subtitle="Segment targeting profile">
        {seg && (
          <div style={{ display: 'grid', gap: 14 }}>
            <div className="grid grid-2">
              <div className="panel" style={{ padding: 12 }}><div className="eyebrow" style={{ fontSize: 9 }}>Customers</div><b className="tabular">{fmtInt(seg.customers)}</b></div>
              <div className="panel" style={{ padding: 12 }}><div className="eyebrow" style={{ fontSize: 9 }}>Revenue share</div><b className="tabular">{fmtPctPlain(seg.revenueSharePct)}</b></div>
              <div className="panel" style={{ padding: 12 }}><div className="eyebrow" style={{ fontSize: 9 }}>Avg monetary</div><b className="tabular">{fmtCurrency(seg.avgMonetary)}</b></div>
              <div className="panel" style={{ padding: 12 }}><div className="eyebrow" style={{ fontSize: 9 }}>Avg recency</div><b className="tabular">{seg.avgRecencyDays} days</b></div>
            </div>
            <div>
              <div className="eyebrow" style={{ marginBottom: 6 }}>Recommended strategy</div>
              <p className="muted" style={{ fontSize: 'var(--fs-sm)' }}>{seg.strategy}</p>
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              <div className="eyebrow">Profile</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Chip tone="info">avg frequency {seg.avgFrequency}</Chip>
                <Chip tone="accent">share of customers {fmtPctPlain(seg.sharePct)}</Chip>
                <PriorityBadge priority={seg.name.includes('At-Risk') ? 'high' : seg.name.includes('High') ? 'medium' : 'low'} />
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}

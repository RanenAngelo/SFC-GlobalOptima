import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { DineIQApi } from '../api/DineIQApi';
import { Panel } from '../components/ui/Panel';
import { ChartCard } from '../components/ui/ChartCard';
import { AnalyticNarrative, SectionHeader } from '../components/ui/Narrative';
import { KpiTile, Reveal } from '../components/ui/Motion';
import { TrendChart } from '../components/charts/BasicCharts';
import { BasicScatter } from '../components/charts/ScatterCharts';
import { DataTable, Column } from '../components/ui/DataTable';
import { Chip, PriorityBadge } from '../components/ui/Badges';
import { AnomalyRow, RatingAnalytics } from '../api/types';
import { fmtDate, fmtInt, fmtNum, titleCase } from '../utils/format';

const KIND_TONE: Record<string, 'danger' | 'warn' | 'info' | 'accent'> = {
  sales_spike: 'warn', sales_drop: 'danger', high_order_value: 'info', unusual_discount: 'warn',
  unexpected_demand: 'info', duplicate_transaction: 'danger',
  rating_spike: 'warn', rating_drop: 'danger', identical_ratings: 'warn',
  rating_burst: 'info', rating_purchase_mismatch: 'accent',
};

export default function AnomaliesPage() {
  const [tab, setTab] = useState<'sales' | 'ratings'>('sales');
  const an = useApi((f) => DineIQApi.getAnomalyAnalytics(f));
  const rt = useApi((f) => DineIQApi.getRatingAnalytics(f));

  const sales = an.data?.sales ?? [];
  const ratingAn = rt.data?.anomalies ?? [];

  const cols: Column<AnomalyRow>[] = [
    { key: 'date', header: 'Date', value: (r) => r.date, render: (r) => fmtDate(r.date) },
    { key: 'kind', header: 'Type', value: (r) => r.kind, render: (r) => <Chip tone={KIND_TONE[r.kind] ?? 'info'}>{titleCase(r.kind)}</Chip> },
    { key: 'entity', header: 'Entity', value: (r) => r.entity, render: (r) => <span style={{ fontWeight: 600 }}>{r.entity}</span> },
    { key: 'observed', header: 'Observed vs expected', value: (r) => r.observed,
      render: (r) => (
        <span style={{ fontSize: 11.5 }}>
          {r.observed} <span className="faint">· expected {r.expected}</span>
        </span>
      ) },
    { key: 'sigma', header: 'Deviation', value: (r) => r.deviationSigma, align: 'right',
      render: (r) => <span className="tabular chip danger">{r.deviationSigma}σ</span> },
    { key: 'sev', header: 'Severity', value: (r) => r.severity, render: (r) => <PriorityBadge priority={r.severity} /> },
    { key: 'resolved', header: 'Status', value: (r) => (r.resolved ? 1 : 0),
      render: (r) => r.resolved ? <Chip tone="success">resolved</Chip> : <Chip tone="warn">open</Chip> },
  ];

  const ratingCols: Column<RatingAnalytics['byItem'][number]>[] = [
    { key: 'name', header: 'Item', value: (r) => r.name, render: (r) => <span style={{ fontWeight: 600 }}>{r.name}</span> },
    { key: 'rating', header: 'Rating', value: (r) => r.rating, align: 'right', render: (r) => <span className="tabular">★ {r.rating.toFixed(1)}</span> },
    { key: 'count', header: 'Ratings', value: (r) => r.count, align: 'right', render: (r) => <span className="tabular">{fmtInt(r.count)}</span> },
    { key: 'trend', header: 'Trend', value: (r) => r.trendPct, align: 'right',
      render: (r) => <Chip tone={r.trendPct >= 0 ? 'success' : 'danger'}>{r.trendPct >= 0 ? '+' : ''}{r.trendPct}%</Chip> },
  ];

  const rows = tab === 'sales' ? sales : ratingAn;

  return (
    <div>
      <SectionHeader
        eyebrow="Analytics · Outlier Surveillance"
        title="Anomaly Detection"
        desc="Statistical control bands over sales, discounts, order values and rating velocity — investigate before acting."
        right={
          <div style={{ display: 'inline-flex', gap: 6 }}>
            <button className={`btn btn-sm ${tab === 'sales' ? 'btn-primary' : ''}`} onClick={() => setTab('sales')}>Sales</button>
            <button className={`btn btn-sm ${tab === 'ratings' ? 'btn-primary' : ''}`} onClick={() => setTab('ratings')}>Ratings</button>
          </div>
        }
      />

      <Reveal>
        <div className="grid grid-4" style={{ marginBottom: 16 }}>
          <KpiTile label="Open anomalies" value={an.data?.sales.filter((a) => !a.resolved).length ?? 0} format={(v) => fmtInt(v)} foot="sales-side" accent />
          <KpiTile label="Critical severity" value={[...sales, ...ratingAn].filter((a) => a.severity === 'critical').length} format={(v) => fmtInt(v)} foot="across both streams" />
          <KpiTile label="Rating anomalies" value={ratingAn.length} format={(v) => fmtInt(v)} foot="bursts · drops · mismatches" />
          <KpiTile label="Avg rating" value={rt.data?.averageRating ?? 0} format={(v) => `★ ${v.toFixed(2)}`} foot="all items, weighted" />
        </div>
      </Reveal>

      <div className="grid grid-2" style={{ marginBottom: 16 }}>
        <Reveal>
          <ChartCard title="Anomaly timeline" subtitle="Events detected per day"
            loading={an.status === 'loading'} error={an.status === 'error' ? an.error : null} onRetry={an.reload}
            empty={!an.data || an.data.timeline.length === 0} height={220}>
            <TrendChart data={(an.data?.timeline ?? []) as never[]} xKey="date"
              series={[{ key: 'count', name: 'Anomalies', color: 'var(--chart-5)' }]} format={(v) => fmtInt(v)} />
          </ChartCard>
        </Reveal>
        <Reveal delay={0.05}>
          <ChartCard title="Rating vs profitability" subtitle="Highly rated ≠ highly profitable"
            loading={rt.status === 'loading'} error={rt.status === 'error' ? rt.error : null} onRetry={rt.reload}
            empty={!rt.data || rt.data.vsProfitability.length === 0} height={306}>
            <BasicScatter
              points={(rt.data?.vsProfitability ?? []).map((p) => ({ x: p.marginPct, y: p.rating, label: p.name, extra: `margin ${p.marginPct}% · rating ${p.rating}` }))}
              xLabel="Margin %" yLabel="Rating"
            />
          </ChartCard>
        </Reveal>
      </div>

      <Reveal>
        <Panel
          title={tab === 'sales' ? 'Sales anomalies' : 'Rating anomalies'}
          subtitle={tab === 'sales' ? 'Spikes, drops, unusual discounts, duplicate transactions' : 'Bursts, drops, identical ratings, purchase mismatches'}
          pad={false}
          actions={<Chip tone="danger">{rows.length} detected</Chip>}
        >
          <div style={{ padding: '4px 16px 16px' }}>
            <DataTable
              columns={cols} rows={rows}
              loading={an.status === 'loading' || rt.status === 'loading'}
              error={an.status === 'error' ? an.error : rt.status === 'error' ? rt.error : null}
              onRetry={an.reload} rowKey={(r) => r.id} pageSize={8}
              exportName={`dineiq-${tab}-anomalies`}
            />
          </div>
        </Panel>
      </Reveal>

      <Reveal>
        <Panel title="Item ratings" subtitle="Ranked best → worst with trend" style={{ marginTop: 16 }}>
          <DataTable
            columns={ratingCols} rows={rt.data?.byItem ?? []}
            loading={rt.status === 'loading'} error={rt.status === 'error' ? rt.error : null}
            onRetry={rt.reload} rowKey={(r) => r.id} pageSize={6}
            exportName="dineiq-item-ratings"
          />
        </Panel>
      </Reveal>

      <div style={{ marginTop: 16 }}>
        <AnalyticNarrative narrative={an.data?.narrative} />
      </div>

      <div className="faint" style={{ marginTop: 12, fontSize: 11 }}>
        Showing {fmtNum(sales.length + ratingAn.length, 0)} events · rating sample μ = {rt.data ? fmtNum(rt.data.averageRating, 2) : '—'}
      </div>
    </div>
  );
}

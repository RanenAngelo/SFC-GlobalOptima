import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { DineIQApi } from '../api/DineIQApi';
import { KpiTile, Reveal } from '../components/ui/Motion';
import { ChartCard } from '../components/ui/ChartCard';
import { Panel } from '../components/ui/Panel';
import { TrendChart, RankBars } from '../components/charts/BasicCharts';
import { PriorityBadge } from '../components/ui/Badges';
import { AnalyticNarrative, SectionHeader } from '../components/ui/Narrative';
import { fmtCompact, fmtCurrency, fmtInt, titleCase } from '../utils/format';

export default function JourneyPage() {
  const ov = useApi((f) => DineIQApi.getDashboardOverview(f));
  const rev = useApi((f) => DineIQApi.getRevenueAnalytics(f));
  const pk = useApi((f) => DineIQApi.getPeakPeriodAnalytics(f));
  const cust = useApi((f) => DineIQApi.getCustomerAnalytics(f));
  const fc = useApi((f) => DineIQApi.getForecastAnalytics(f, 30, 'category'));
  const ws = useApi((f) => DineIQApi.getWastageAnalytics(f));
  const an = useApi((f) => DineIQApi.getAnomalyAnalytics(f));
  const rec = useApi((f) => DineIQApi.getRecommendations(f));

  const kpis = ov.data?.kpis;

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <SectionHeader
        eyebrow="Overview · Command Center"
        title="Command Center"
        desc="Executive restaurant intelligence — real-time trading performance, predictive demand, guest retention, and operational controls."
        right={<span className="chip accent"><Sparkles size={12} /> Live Engine Active</span>}
      />

      <Reveal>
        <div className="grid grid-4" style={{ gap: 14 }}>
          {kpis ? (
            <>
              <KpiTile label="Revenue" value={kpis.revenue.value} format={(v) => fmtCurrency(v)} delta={kpis.revenue} accent />
              <KpiTile label="Profit" value={kpis.profit.value} format={(v) => fmtCurrency(v)} delta={kpis.profit} />
              <KpiTile label="Orders" value={kpis.orders.value} format={(v) => fmtInt(v)} delta={kpis.orders} />
              <KpiTile label="Avg check value" value={kpis.averageOrderValue.value} format={(v) => fmtCurrency(v)} delta={kpis.averageOrderValue} />
              <KpiTile label="Active guests" value={kpis.activeCustomers.value} format={(v) => fmtInt(v)} delta={kpis.activeCustomers} />
              <KpiTile label="Repeat guests" value={kpis.repeatCustomers.value} format={(v) => fmtInt(v)} delta={kpis.repeatCustomers} />
              <KpiTile label="Wastage cost" value={kpis.wastageCost.value} format={(v) => fmtCurrency(v)} delta={kpis.wastageCost} />
              <KpiTile label="Forecast demand" value={kpis.forecastDemand.value} format={(v) => fmtInt(v)} delta={kpis.forecastDemand} />
            </>
          ) : Array.from({ length: 8 }, (_, i) => <div key={i} className="skeleton" style={{ height: 110 }} />)}
        </div>
      </Reveal>

      {(ov.data?.topAlerts ?? []).length > 0 && (
        <Reveal delay={0.04}>
          <div className="grid grid-3" style={{ gap: 12 }}>
            {ov.data!.topAlerts.slice(0, 3).map((a) => (
              <div key={a.id} className="panel" style={{ padding: 14, borderLeft: '3px solid var(--accent)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <b style={{ fontSize: 13, letterSpacing: '-0.01em' }}>{a.title}</b>
                  <PriorityBadge priority={a.priority} />
                </div>
                <p className="muted" style={{ fontSize: 12, marginTop: 6, lineHeight: 1.45 }}>{a.detail}</p>
              </div>
            ))}
          </div>
        </Reveal>
      )}

      <div className="grid grid-2" style={{ gap: 16 }}>
        <Reveal delay={0.08}>
          <ChartCard
            title="Revenue trajectory"
            subtitle="Daily revenue trend across selected trading period"
            loading={rev.status === 'loading'}
            error={rev.status === 'error' ? rev.error : null}
            onRetry={rev.reload}
            empty={!rev.data || rev.data.series.length === 0}
            actions={<Link to="/performance" className="btn btn-ghost btn-sm">Deep dive <ArrowRight size={13} /></Link>}
          >
            <TrendChart
              data={(rev.data?.series ?? []) as never[]}
              xKey="date"
              series={[{ key: 'value', name: 'Revenue' }]}
              format={(v) => fmtCompact(v)}
            />
          </ChartCard>
        </Reveal>

        <Reveal delay={0.1}>
          <ChartCard
            title="Order volume & peak intensity"
            subtitle="Monthly order aggregation and structural volume"
            loading={pk.status === 'loading'}
            error={pk.status === 'error' ? pk.error : null}
            onRetry={pk.reload}
            empty={!pk.data || pk.data.monthly.length === 0}
            actions={<Link to="/performance" className="btn btn-ghost btn-sm">Peak heatmaps <ArrowRight size={13} /></Link>}
          >
            <TrendChart
              data={(pk.data?.monthly ?? []) as never[]}
              xKey="month"
              series={[{ key: 'orders', name: 'Orders', color: 'var(--chart-6)' }]}
              format={(v) => fmtCompact(v)}
            />
          </ChartCard>
        </Reveal>
      </div>

      <div className="grid grid-2" style={{ gap: 16 }}>
        <Reveal delay={0.12}>
          <ChartCard
            title="Predictive demand forecast"
            subtitle="30-day category demand projection with historical baseline"
            loading={fc.status === 'loading'}
            error={fc.status === 'error' ? fc.error : null}
            onRetry={fc.reload}
            empty={!fc.data || fc.data.points.length === 0}
            actions={<Link to="/forecast" className="btn btn-ghost btn-sm">Model metrics <ArrowRight size={13} /></Link>}
            footer={fc.data && <span className="chip info">{fc.data.splitNote}</span>}
          >
            <TrendChart
              data={(fc.data?.points ?? []).filter((p) => p.predicted !== undefined).slice(-45) as never[]}
              xKey="date"
              showLegend
              series={[
                { key: 'actual', name: 'Actual' },
                { key: 'predicted', name: 'Forecast', color: 'var(--chart-2)' },
              ]}
              format={(v) => fmtInt(v)}
            />
          </ChartCard>
        </Reveal>

        <Reveal delay={0.14}>
          <ChartCard
            title="Revenue by menu category"
            subtitle="Category ranking with margin & profit overlay"
            loading={rev.status === 'loading'}
            error={rev.status === 'error' ? rev.error : null}
            onRetry={rev.reload}
            empty={!rev.data || rev.data.byCategory.length === 0}
            actions={<Link to="/menu" className="btn btn-ghost btn-sm">Menu matrix <ArrowRight size={13} /></Link>}
          >
            <RankBars
              data={(rev.data?.byCategory ?? []).map((c) => ({ name: c.name, value: c.revenue, alt: c.profit, rawAlt: c.profit }))}
              format={(v) => fmtCompact(v)}
              valueName="Revenue"
              altName="Profit"
              showAlt
            />
          </ChartCard>
        </Reveal>
      </div>

      <div className="grid grid-2" style={{ gap: 16 }}>
        <Reveal delay={0.16}>
          <ChartCard
            title="Customer segments & retention"
            subtitle="RFM behavioral concentration and guest share"
            loading={cust.status === 'loading'}
            error={cust.status === 'error' ? cust.error : null}
            onRetry={cust.reload}
            empty={!cust.data || cust.data.segments.length === 0}
            actions={<Link to="/customers" className="btn btn-ghost btn-sm">Customer RFM <ArrowRight size={13} /></Link>}
          >
            <RankBars
              data={(cust.data?.segments ?? []).map((s) => ({ name: s.name, value: s.revenueSharePct }))}
              format={(v) => `${v.toFixed(1)}%`}
              colorIndex={2}
            />
          </ChartCard>
        </Reveal>

        <Reveal delay={0.18}>
          <ChartCard
            title="Wastage cost by ingredient category"
            subtitle="Top audited waste lines by volume and financial loss"
            loading={ws.status === 'loading'}
            error={ws.status === 'error' ? ws.error : null}
            onRetry={ws.reload}
            empty={!ws.data || ws.data.topItems.length === 0}
            actions={<Link to="/wastage" className="btn btn-ghost btn-sm">Inventory audits <ArrowRight size={13} /></Link>}
          >
            <RankBars
              data={(ws.data?.topItems ?? []).slice(0, 6).map((it) => ({ name: it.name, value: it.kg }))}
              format={(v) => `${fmtInt(v)} kg`}
              colorIndex={4}
            />
          </ChartCard>
        </Reveal>
      </div>

      <div className="grid grid-2" style={{ gap: 16 }}>
        <Reveal delay={0.2}>
          <Panel
            title="Executive recommendations"
            subtitle="Algorithmic action items prioritized by financial impact"
            actions={<Link to="/recommendations" className="btn btn-ghost btn-sm">All recommendations <ArrowRight size={13} /></Link>}
          >
            <div style={{ display: 'grid', gap: 10 }}>
              {rec.status === 'loading' ? (
                Array.from({ length: 4 }, (_, i) => <div key={i} className="skeleton" style={{ height: 58 }} />)
              ) : (rec.data?.items ?? []).length > 0 ? (
                rec.data!.items.slice(0, 4).map((r) => (
                  <div key={r.id} className="panel" style={{ padding: 13, borderLeft: `3px solid var(--priority-${r.priority})` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                      <b style={{ fontSize: 13 }}>{r.action}</b>
                      <PriorityBadge priority={r.priority} />
                    </div>
                    <p className="faint" style={{ fontSize: 12, marginTop: 4 }}>{r.impactEstimate}</p>
                  </div>
                ))
              ) : (
                (ov.data?.topAlerts ?? []).map((a) => (
                  <div key={a.id} className="panel" style={{ padding: 13, borderLeft: '3px solid var(--accent)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                      <b style={{ fontSize: 13 }}>{a.title}</b>
                      <PriorityBadge priority={a.priority} />
                    </div>
                    <p className="faint" style={{ fontSize: 12, marginTop: 4 }}>{a.detail}</p>
                  </div>
                ))
              )}
            </div>
          </Panel>
        </Reveal>

        <Reveal delay={0.22}>
          <Panel
            title="Active anomaly flags"
            subtitle="Statistical deviations detected across store branches"
            actions={<Link to="/anomalies" className="btn btn-ghost btn-sm">Investigation log <ArrowRight size={13} /></Link>}
          >
            <div style={{ display: 'grid', gap: 10 }}>
              {(an.data?.sales ?? []).slice(0, 4).map((a) => (
                <div key={a.id} className="panel" style={{ padding: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                  <div style={{ minWidth: 0 }}>
                    <b style={{ fontSize: 13 }}>{titleCase(a.kind)} · {a.entity}</b>
                    <span className="faint" style={{ display: 'block', fontSize: 11.5, marginTop: 2 }}>
                      {a.observed} ({a.deviationSigma}σ deviation)
                    </span>
                  </div>
                  <PriorityBadge priority={a.severity} />
                </div>
              ))}
              {!an.data && Array.from({ length: 4 }, (_, i) => <div key={i} className="skeleton" style={{ height: 58 }} />)}
            </div>
          </Panel>
        </Reveal>
      </div>

      {ov.data?.narratives[0] && (
        <Reveal delay={0.24}>
          <AnalyticNarrative narrative={ov.data.narratives[0]} />
        </Reveal>
      )}
    </div>
  );
}

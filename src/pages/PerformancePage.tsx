import { useState, type CSSProperties, type ReactNode } from 'react';
import { CalendarDays, ChevronDown, Clock3, Store, Sun, TrendingDown, TrendingUp, UtensilsCrossed } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import type { TrendPoint } from '../api/types';
import { DineIQApi } from '../api/DineIQApi';
import { Panel } from '../components/ui/Panel';
import { ChartCard } from '../components/ui/ChartCard';
import { AnalyticNarrative, SectionHeader } from '../components/ui/Narrative';
import { KpiTile, Reveal } from '../components/ui/Motion';
import { TrendChart, RankBars } from '../components/charts/BasicCharts';
import { Heatmap } from '../components/charts/Heatmap';
import { useFilters } from '../hooks/useFilters';
import { fmtCompact, fmtCurrency, fmtInt, fmtPctPlain } from '../utils/format';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = Array.from({ length: 18 }, (_, i) => String(i + 6));

type ChartCadence = 'daily' | 'weekly' | 'monthly';

function groupTrendPoints(points: TrendPoint[], cadence: ChartCadence): TrendPoint[] {
  if (cadence === 'daily') return points;
  const buckets = new Map<string, TrendPoint>();
  points.forEach((point) => {
    const date = new Date(`${point.date}T00:00:00Z`);
    if (cadence === 'weekly') {
      const daysFromMonday = (date.getUTCDay() + 6) % 7;
      date.setUTCDate(date.getUTCDate() - daysFromMonday);
    } else {
      date.setUTCDate(1);
    }
    const key = date.toISOString().slice(0, 10);
    const bucket = buckets.get(key) ?? { date: key, value: 0 };
    bucket.value += point.value;
    if (typeof point.compare === 'number') bucket.compare = (bucket.compare ?? 0) + point.compare;
    buckets.set(key, bucket);
  });
  return [...buckets.values()];
}

function ChartCadenceSelect({ value, onChange }: { value: ChartCadence; onChange: (value: ChartCadence) => void }) {
  return (
    <label className="chart-cadence" aria-label="Chart time interval">
      <CalendarDays size={14} aria-hidden="true" />
      <select value={value} onChange={(event) => onChange(event.target.value as ChartCadence)} aria-label="Chart time interval">
        <option value="daily">Daily</option>
        <option value="weekly">Weekly</option>
        <option value="monthly">Monthly</option>
      </select>
      <ChevronDown size={13} aria-hidden="true" />
    </label>
  );
}

function InsightCard({ label, value, detail, tone = 'var(--chart-2)', icon }: { label: string; value: string; detail: string; tone?: string; icon: ReactNode }) {
  return (
    <div className="performance-insight-card" style={{ '--insight-accent': tone } as CSSProperties}>
      <span className="performance-insight-icon" aria-hidden="true">{icon}</span>
      <div className="performance-insight-copy">
        <div className="eyebrow performance-insight-label">{label}</div>
        <div className="performance-insight-value" title={value}>{value}</div>
        <div className="muted performance-insight-detail">{detail}</div>
      </div>
    </div>
  );
}

export default function PerformancePage() {
  const rev = useApi((f) => DineIQApi.getRevenueAnalytics(f));
  const ord = useApi((f) => DineIQApi.getOrderAnalytics(f));
  const peaks = useApi((f) => DineIQApi.getPeakPeriodAnalytics(f));
  const menu = useApi((f) => DineIQApi.getMenuAnalytics(f));
  const locations = useApi((f) => DineIQApi.getLocationAnalytics(f));
  const { filters } = useFilters();
  const [cadence, setCadence] = useState<ChartCadence>('daily');

  const revenue = rev.data;
  const orders = ord.data;
  const pk = peaks.data;

  const aov = revenue && orders && orders.totalOrders > 0 ? revenue.totalRevenue / orders.totalOrders : 0;
  const revenueSeries = [...(revenue?.series ?? [])].sort((a, b) => a.date.localeCompare(b.date));
  const orderSeries = [...(orders?.series ?? [])].sort((a, b) => a.date.localeCompare(b.date));
  const firstRevenue = revenueSeries[0]?.value;
  const lastRevenue = revenueSeries[revenueSeries.length - 1]?.value;
  const revenueHasComparison = revenueSeries.length > 0 && revenueSeries.every((point) => typeof point.compare === 'number');
  const previousRevenue = revenueHasComparison ? revenueSeries.reduce((sum, point) => sum + (point.compare ?? 0), 0) : 0;
  const currentRevenue = revenueHasComparison ? revenueSeries.reduce((sum, point) => sum + point.value, 0) : 0;
  const growth = revenueHasComparison && previousRevenue > 0
    ? ((currentRevenue / previousRevenue) - 1) * 100
    : firstRevenue && lastRevenue !== undefined ? ((lastRevenue - firstRevenue) / firstRevenue) * 100 : null;
  const growthDetail = revenueHasComparison ? 'vs. previous period' : 'Revenue change, first to last day';
  const visibleRevenueSeries = groupTrendPoints(revenueSeries, cadence);
  const visibleOrderSeries = groupTrendPoints(orderSeries, cadence);
  const locationPeak = filters.location ? pk?.locationSpecificPeak[0] : undefined;
  const channelPeak = filters.channel ? pk?.channelPeaks[0] : undefined;
  const topHour = pk?.peakHours.slice().sort((a, b) => b.orders - a.orders)[0];
  const peakHour = locationPeak?.peakHour ?? channelPeak?.peakHour ?? topHour?.hour;
  const peakHourDetail = locationPeak
    ? 'Location-specific peak'
    : channelPeak
      ? `${channelPeak.channel} peak`
      : topHour ? `${fmtInt(topHour.orders)} orders` : peaks.status === 'loading' ? 'Loading peak data' : 'No peak-hour data';
  const topItem = menu.data?.items.slice().sort((a, b) => b.revenue - a.revenue)[0];
  const topChannel = locations.data?.channels.slice().sort((a, b) => b.orders - a.orders)[0];
  const weekdaySeries = (orders?.series ?? []).filter((point) => {
    const day = new Date(`${point.date}T00:00:00Z`).getUTCDay();
    return day >= 1 && day <= 5;
  });
  const weekendSeries = (orders?.series ?? []).filter((point) => {
    const day = new Date(`${point.date}T00:00:00Z`).getUTCDay();
    return day === 0 || day === 6;
  });
  const weekdayAverage = weekdaySeries.reduce((sum, point) => sum + point.value, 0) / Math.max(weekdaySeries.length, 1);
  const weekendAverage = weekendSeries.reduce((sum, point) => sum + point.value, 0) / Math.max(weekendSeries.length, 1);
  const weekendLift = weekdaySeries.length > 0 && weekendSeries.length > 0 && weekdayAverage > 0
    ? ((weekendAverage / weekdayAverage) - 1) * 100
    : null;

  return (
    <div>
      <SectionHeader
        eyebrow="Analytics · Sales & Demand Patterns"
        title="Performance"
        desc="Revenue, orders and peak-period intelligence — the “what happened” layer across the trading period."
        right={<span className="chip accent">Global filters apply</span>}
      />

      <Reveal>
        <div className="grid grid-4" style={{ marginBottom: 16 }}>
          <KpiTile label="Total revenue" value={revenue?.totalRevenue ?? 0} format={(v) => fmtCurrency(v)} foot="selected period" accent />
          <KpiTile label="Total orders" value={orders?.totalOrders ?? 0} format={(v) => fmtInt(v)} foot="cancelled lines excluded"
            delta={orders ? { value: 0, deltaPct: 6.2, direction: 'up' } : undefined} />
          <KpiTile label="Average order value" value={aov} format={(v) => fmtCurrency(v)} foot="revenue ÷ orders" />
          <KpiTile label="Basket size" value={orders?.basketSizeAvg ?? 0} format={(v) => `${v.toFixed(2)} items`} foot={`cancel rate ${orders ? fmtPctPlain(orders.cancelledRate) : '—'}`} />
        </div>
      </Reveal>

      <div className="grid grid-2" style={{ marginBottom: 16 }}>
        <Reveal>
          <ChartCard
            title="Revenue trend" subtitle={`${cadence[0].toUpperCase()}${cadence.slice(1)} revenue for the filtered period`}
            loading={rev.status === 'loading'} error={rev.status === 'error' ? rev.error : null} onRetry={rev.reload}
            empty={!revenue || revenue.series.length === 0}
            actions={<ChartCadenceSelect value={cadence} onChange={setCadence} />}
          >
            <TrendChart data={visibleRevenueSeries as never[]} xKey="date" series={[{ key: 'value', name: 'Revenue', color: 'var(--chart-1)' }]} format={(v) => fmtCompact(v)} showLegend premium />
          </ChartCard>
        </Reveal>
        <Reveal delay={0.06}>
          <ChartCard
            title="Order volume trend" subtitle={`${cadence[0].toUpperCase()}${cadence.slice(1)} orders — weekend lift is structural`}
            loading={ord.status === 'loading'} error={ord.status === 'error' ? ord.error : null} onRetry={ord.reload}
            empty={!orders || orders.series.length === 0}
            actions={<ChartCadenceSelect value={cadence} onChange={setCadence} />}
          >
            <TrendChart data={visibleOrderSeries as never[]} xKey="date" series={[{ key: 'value', name: 'Orders', color: 'var(--chart-6)' }]} format={(v) => fmtInt(v)} showLegend premium />
          </ChartCard>
        </Reveal>
      </div>

      <Reveal>
        <Panel title="Intelligence Summary" subtitle="Insights calculated from the selected period and global filters" glass>
          <div className="grid performance-insight-grid">
            <InsightCard label="Peak Hour" value={peakHour !== undefined ? `${String(peakHour).padStart(2, '0')}:00` : '—'} detail={peakHourDetail} icon={<Clock3 size={17} />} tone="var(--chart-2)" />
            <InsightCard
              label="Growth"
              value={growth === null ? '—' : `${growth > 0 ? '+' : ''}${growth.toFixed(1)}%`}
              detail={growthDetail}
              tone={growth === null ? 'var(--text-2)' : growth >= 0 ? 'var(--success)' : 'var(--danger)'}
              icon={growth !== null && growth < 0 ? <TrendingDown size={17} /> : <TrendingUp size={17} />}
            />
            <InsightCard label="Top Channel" value={topChannel?.channel ?? '—'} detail={topChannel ? `${fmtInt(topChannel.orders)} orders` : locations.status === 'loading' ? 'Loading channel data' : 'No channel data'} icon={<Store size={17} />} tone="var(--chart-4)" />
            <InsightCard label="Best Performing Item" value={topItem?.name ?? '—'} detail={topItem ? `${fmtCurrency(topItem.revenue)} revenue` : menu.status === 'loading' ? 'Loading menu data' : 'No item data'} icon={<UtensilsCrossed size={17} />} tone="var(--accent)" />
            <InsightCard label="Weekend Lift" value={weekendLift === null ? '—' : `${weekendLift > 0 ? '+' : ''}${weekendLift.toFixed(1)}%`} detail="Avg daily orders vs weekdays" tone={weekendLift === null ? 'var(--text-2)' : weekendLift >= 0 ? 'var(--info)' : 'var(--danger)'} icon={<Sun size={17} />} />
          </div>
        </Panel>
      </Reveal>

      <Reveal>
        <ChartCard
          title="Revenue by menu category" subtitle="Where the money is made — ranking with profit overlay"
          loading={rev.status === 'loading'} error={rev.status === 'error' ? rev.error : null} onRetry={rev.reload}
          empty={!revenue || revenue.byCategory.length === 0}
          height={320}
        >
          <RankBars
            data={(revenue?.byCategory ?? []).map((c) => ({ name: c.name, value: c.revenue, alt: c.profit, rawAlt: c.profit }))}
            format={(v) => fmtCompact(v)}
            valueName="Revenue"
            altName="Profit"
            showAlt
          />
        </ChartCard>
      </Reveal>

      <div className="grid grid-2" style={{ marginTop: 16 }}>
        <Reveal>
          <Panel title="Peak hours × weekday" subtitle="Order intensity operational heatmap">
            {peaks.status === 'loading' ? (
              <div className="skeleton" style={{ height: 260 }} />
            ) : pk ? (
              <Heatmap
                data={pk.heatmap.map((h) => ({ row: h.day, col: h.hour - 6, value: h.orders }))}
                rowLabels={DAYS} colLabels={HOURS} format={(v) => `${fmtInt(v)} orders`}
              />
            ) : (
              <div className="skeleton" style={{ height: 260 }} />
            )}
          </Panel>
        </Reveal>

        <div style={{ display: 'grid', gap: 16, alignContent: 'start' }}>
          <Reveal>
            <ChartCard
              title="Peak hours" subtitle="Top ordering hours by volume"
              loading={peaks.status === 'loading'} error={peaks.status === 'error' ? peaks.error : null} onRetry={peaks.reload}
              empty={!pk || pk.peakHours.length === 0}
              height={190}
              footer={
                pk && (
                  <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                    <span className="chip accent">Weekend share {fmtPctPlain(pk.weekendRatio)}</span>
                    <span className="chip">Peak day · {DAYS[pk.peakDays[0]?.day ?? 0]}</span>
                    <span className="chip info">Seasonal peak · {pk.seasonal.sort((a, b) => b.index - a.index)[0]?.season}</span>
                  </div>
                )
              }
            >
              <RankBars data={(pk?.peakHours ?? []).map((h) => ({ name: `${h.hour}:00`, value: h.orders }))} format={(v) => fmtInt(v)} height={190} colorIndex={5} />
            </ChartCard>
          </Reveal>

          <Reveal>
            <ChartCard
              title="Monthly trend" subtitle="Orders & revenue by month"
              loading={peaks.status === 'loading'} error={peaks.status === 'error' ? peaks.error : null} onRetry={peaks.reload}
              empty={!pk || pk.monthly.length === 0}
              height={210}
            >
              <TrendChart data={(pk?.monthly ?? []) as never[]} xKey="month" showLegend
                series={[{ key: 'orders', name: 'Orders' }, { key: 'revenue', name: 'Revenue', color: 'var(--chart-3)' }]}
                format={(v) => fmtCompact(v)} />
            </ChartCard>
          </Reveal>
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <AnalyticNarrative narrative={pk?.narrative} />
      </div>
    </div>
  );
}

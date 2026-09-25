/**
 * DEVELOPMENT / DEMO DATA — executive overview (Step 42).
 */

import { DashboardOverview, OverviewAlert, TrendPoint } from '../../api/types';
import { between, lastNDays, round, rng } from './_util';

export function buildOverview(): DashboardOverview {
  const r = rng(42);
  const days = lastNDays(120);

  const revenueTrend: TrendPoint[] = days.map((date, i) => {
    const base = 410_000 + i * 900;
    const weekend = new Date(date).getUTCDay();
    const w = weekend === 0 || weekend === 6 ? 1.24 : 1;
    const noise = between(r, 0.9, 1.1);
    return { date, value: round(base * w * noise) };
  });
  const orderTrend: TrendPoint[] = revenueTrend.map((p, i) => ({
    date: p.date,
    value: round(p.value / between(r, 780, 1060)),
  }));

  const alerts: OverviewAlert[] = [
    { id: 'A1', kind: 'anomaly', title: 'Sales spike at Marine Drive', detail: 'Orders +64% vs 8σ band on 22 Sep — verify promotions & channel mix.', priority: 'high' },
    { id: 'A2', kind: 'promotion', title: 'Promotion trap detected', detail: '"Late Night 20%" lifted revenue 9% while contribution margin fell 6.4%.', priority: 'critical' },
    { id: 'A3', kind: 'wastage', title: 'Wastage risk rising', detail: 'Truffle Fries predicted +28kg over-prep next weekend.', priority: 'high' },
    { id: 'A4', kind: 'model', title: 'Pipeline disagreement', detail: 'Spark vs Python disagree on 11 of 120 menu-classification records (90.8% agreement).', priority: 'medium' },
    { id: 'A5', kind: 'forecast', title: 'Demand surge expected', detail: 'Weekend forecast +18% at Clifton — staff and stock accordingly.', priority: 'medium' },
  ];

  return {
    kpis: {
      revenue: { value: 58_420_000, deltaPct: 8.4, direction: 'up' },
      profit: { value: 14_260_000, deltaPct: 5.1, direction: 'up' },
      orders: { value: 186_430, deltaPct: 6.2, direction: 'up' },
      averageOrderValue: { value: 3_134, deltaPct: 1.4, direction: 'up' },
      activeCustomers: { value: 48_210, deltaPct: 3.7, direction: 'up' },
      repeatCustomers: { value: 31_880, deltaPct: 2.2, direction: 'up' },
      wastageCost: { value: 2_140_000, deltaPct: 4.9, direction: 'up', invertGood: true },
      forecastDemand: { value: 12_480, deltaPct: 12.0, direction: 'up' },
      criticalRecommendations: 7,
      openAnomalies: 14,
      overallRating: { value: 4.4, deltaPct: 0.6, direction: 'up' },
    },
    revenueTrend,
    orderTrend,
    topAlerts: alerts,
    narratives: [
      {
        happened: 'Revenue grew 8.4% this period, led by weekend grill and delivery-channel orders.',
        why: 'Two high-margin Profit Drivers (Charcoal Ribeye, Margherita) carried 31% of contribution margin while a promotion trap eroded margin on late-night orders.',
        next: 'Rebalance late-night discounting, protect grill capacity for weekends, and push the Hidden Opportunity cold-brew float in loyalty campaigns.',
        severity: 'high',
      },
      {
        happened: 'Wastage cost rose 4.9% despite stable prep volumes.',
        why: 'Three popular items show over-preparation on weekends; two low performers sit above 9% wastage of prep.',
        next: 'Apply the predictive prep-reduction recommendation for Truffle Fries and review Low Performers at the next menu meeting.',
        severity: 'medium',
      },
    ],
  };
}

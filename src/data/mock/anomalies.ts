/**
 * DEVELOPMENT / DEMO DATA — anomalies & ratings (Steps 29–31).
 */

import { AnomalyAnalytics, AnomalyKind, AnomalyRow, RatingAnalytics, TrendPoint } from '../../api/types';
import { between, lastNDays, pick, round, rng } from './_util';
import { ITEMS, LOCATIONS } from './catalog';

const KINDS: AnomalyKind[] = [
  'sales_spike', 'sales_drop', 'high_order_value', 'unusual_discount',
  'unexpected_demand', 'duplicate_transaction', 'rating_spike', 'rating_drop',
  'identical_ratings', 'rating_burst', 'rating_purchase_mismatch',
];

function generateAnomalies(count: number, seed: number, kinds: AnomalyKind[]): AnomalyRow[] {
  const r = rng(seed);
  const rows: AnomalyRow[] = [];
  for (let i = 0; i < count; i++) {
    const kind = pick(r, kinds);
    const loc = pick(r, [...LOCATIONS]);
    const item = pick(r, [...ITEMS]);
    const isRating = kind.startsWith('rating') || kind === 'identical_ratings';
    const entity = isRating ? item.name : loc.name;
    const sev = r() > 0.72 ? 'critical' : r() > 0.42 ? 'high' : r() > 0.18 ? 'medium' : 'low';
    rows.push({
      id: `AN${String(seed + i).padStart(4, '0')}`,
      date: lastNDays(75)[Math.floor(r() * 75)],
      kind,
      entity,
      severity: sev,
      observed:
        kind === 'sales_spike' ? `Orders +${round(between(r, 40, 180))}% vs expected band`
        : kind === 'sales_drop' ? `Orders −${round(between(r, 35, 78))}% vs expected band`
        : kind === 'high_order_value' ? `Order value ₨${round(between(r, 24_000, 96_000)).toLocaleString()}`
        : kind === 'unusual_discount' ? `${round(between(r, 46, 82))}% discount applied outside campaign window`
        : kind === 'unexpected_demand' ? `Demand index ${round(between(r, 1.8, 3.6), 1)}× baseline`
        : kind === 'duplicate_transaction' ? 'Duplicate transaction fingerprint detected'
        : kind === 'rating_spike' ? `Ratings +${round(between(r, 120, 640))}% in 24h`
        : kind === 'rating_drop' ? `Average rating fell ${round(between(r, 0.8, 1.9), 1)} pts in 48h`
        : kind === 'identical_ratings' ? `${round(between(r, 18, 46))} identical 5★ ratings`
        : kind === 'rating_burst' ? `${round(between(r, 60, 240))} ratings in 3 hours`
        : 'High ratings with no matching purchases',
      expected: isRating ? '3.7 – 4.8 band' : '±2.5σ control band',
      deviationSigma: round(between(r, 2.6, 6.4), 1),
      resolved: r() > 0.55,
    });
  }
  return rows.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function buildAnomalies(): AnomalyAnalytics {
  const sales = generateAnomalies(18, 501, ['sales_spike', 'sales_drop', 'high_order_value', 'unusual_discount', 'unexpected_demand', 'duplicate_transaction']);
  const ratings = generateAnomalies(12, 733, ['rating_spike', 'rating_drop', 'identical_ratings', 'rating_burst', 'rating_purchase_mismatch']);

  const days = lastNDays(45);
  const r = rng(2020);
  const timeline = days.map((date) => ({
    date,
    count: Math.round(between(r, 0, 5)),
    severity: (r() > 0.7 ? 'critical' : r() > 0.4 ? 'high' : 'medium') as AnomalyRow['severity'],
  }));

  return {
    sales,
    ratings,
    timeline,
    narrative: {
      happened: `${sales.length} sales-side and ${ratings.length} rating-side anomalies detected in the last 75 days.`,
      why: 'Statistical control bands (z-score) over orders, discounts, order values and rating velocity flag events outside expected behavior.',
      next: 'Investigate unresolved critical anomalies first — they often correlate with promotion misconfiguration or channel errors.',
      severity: 'high',
    },
  };
}

export function buildRatings(): RatingAnalytics {
  const r = rng(6161);
  const trend: TrendPoint[] = lastNDays(60).map((date) => ({ date, value: round(between(r, 4.0, 4.8), 2) }));

  const byItem = ITEMS.map((it, i) => {
    const rr = rng(100 + i);
    return {
      id: it.id,
      name: it.name,
      rating: round(between(rr, 3.1, 4.9), 1),
      count: Math.round(between(rr, 120, 4_800)),
      trendPct: round(between(rr, -8, 9), 1),
    };
  }).sort((a, b) => b.rating - a.rating);

  const byLocation = LOCATIONS.slice(0, 14).map((l, i) => {
    const rr = rng(300 + i);
    return { location: l.name, rating: round(between(rr, 3.6, 4.9), 1) };
  });

  const vsProfitability = byItem.slice(0, 18).map((b, i) => ({
    name: b.name,
    rating: b.rating,
    marginPct: round(between(rng(77 + i), 12, 74), 1),
  }));

  const anomalies = buildAnomalies().ratings as AnomalyRow[];

  return {
    averageRating: round(byItem.reduce((s, b) => s + b.rating, 0) / byItem.length, 2),
    trend,
    byItem,
    byLocation,
    vsProfitability,
    anomalies,
    narrative: {
      happened: 'Ratings average is healthy but diverges from profitability for a handful of items.',
      why: 'Highly rated items with weak margins and sudden rating bursts both appear in this window.',
      next: 'Separate genuine quality signals from rating anomalies before repricing or redesign decisions.',
      severity: 'medium',
    },
  };
}

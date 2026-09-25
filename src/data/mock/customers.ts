/**
 * DEVELOPMENT / DEMO DATA — customer intelligence (Steps 15, 16, 36, 44).
 */

import {
  ChurnRiskRow, CustomerAnalytics, CustomerSegment, CustomerTrendPoint,
  RfmDistribution, RfmRow,
} from '../../api/types';
import { between, lastNDays, round, rng } from './_util';
import { SEGMENTS } from './catalog';

const SEG_META: Record<string, { share: number; mon: [number, number]; freq: [number, number]; rec: [number, number]; revenueShare: number; strategy: string }> = {
  'High-Value Loyal': { share: 0.09, mon: [95_000, 240_000], freq: [18, 42], rec: [1, 18], revenueShare: 34, strategy: 'Reward & protect — early access, concierge offers.' },
  Frequent: { share: 0.17, mon: [38_000, 92_000], freq: [12, 26], rec: [2, 24], revenueShare: 27, strategy: 'Upsell higher-margin categories on every visit.' },
  'Promotion-Driven': { share: 0.15, mon: [21_000, 54_000], freq: [7, 18], rec: [4, 40], revenueShare: 14, strategy: 'Bundle value offers that protect margin.' },
  'At-Risk': { share: 0.12, mon: [30_000, 88_000], freq: [4, 12], rec: [46, 130], revenueShare: 11, strategy: 'Win-back sequence with time-boxed incentive.' },
  'New': { share: 0.14, mon: [3_000, 14_000], freq: [1, 3], rec: [1, 30], revenueShare: 5, strategy: 'Onboarding journey → second-order nudge.' },
  Occasional: { share: 0.33, mon: [6_000, 26_000], freq: [2, 6], rec: [30, 150], revenueShare: 9, strategy: 'Occasion-based triggers (weekends, events).' },
};

export function buildSegments(): CustomerSegment[] {
  return SEGMENTS.map((name, i) => {
    const meta = SEG_META[name];
    const r = rng(500 + i * 31);
    const customers = Math.round(52_000 * meta.share);
    return {
      id: name.toLowerCase().replace(/[^a-z]+/g, '_'),
      name,
      customers,
      sharePct: round(meta.share * 100, 1),
      avgMonetary: Math.round(between(r, meta.mon[0], meta.mon[1])),
      avgFrequency: Math.round(between(r, meta.freq[0], meta.freq[1])),
      avgRecencyDays: Math.round(between(r, meta.rec[0], meta.rec[1])),
      revenueSharePct: meta.revenueShare,
      strategy: meta.strategy,
    };
  });
}

export function buildRfmRows(count = 140): RfmRow[] {
  const rows: RfmRow[] = [];
  for (let i = 0; i < count; i++) {
    const r = rng(9000 + i * 7);
    const seg = SEGMENTS[Math.floor(r() * SEGMENTS.length)];
    const meta = SEG_META[seg];
    const recencyDays = Math.round(between(r, meta.rec[0], meta.rec[1]));
    const frequency = Math.round(between(r, meta.freq[0], meta.freq[1]));
    const monetary = Math.round(between(r, meta.mon[0], meta.mon[1]));
    rows.push({
      customerId: `C${String(10_000 + i).padStart(5, '0')}`,
      recencyDays,
      frequency,
      monetary,
      rScore: recencyDays <= 14 ? 5 : recencyDays <= 35 ? 4 : recencyDays <= 70 ? 3 : recencyDays <= 110 ? 2 : 1,
      fScore: frequency >= 24 ? 5 : frequency >= 15 ? 4 : frequency >= 8 ? 3 : frequency >= 4 ? 2 : 1,
      mScore: monetary >= 120_000 ? 5 : monetary >= 70_000 ? 4 : monetary >= 35_000 ? 3 : monetary >= 12_000 ? 2 : 1,
      segmentId: seg.toLowerCase().replace(/[^a-z]+/g, '_'),
    });
  }
  return rows.sort((a, b) => b.monetary - a.monetary);
}

function buildRfm(): RfmDistribution {
  const rows = buildRfmRows();
  const bins: { label: string; count: number }[] = [];
  for (let s = 5; s >= 1; s--) {
    bins.push({ label: `RFM ${s}`, count: rows.filter((r) => Math.round((r.rScore + r.fScore + r.mScore) / 3) === s).length });
  }
  return {
    rows,
    bins,
    narrative: {
      happened: 'The top RFM decile contributes a disproportionate share of monetary value while a growing tail shows rising recency.',
      why: 'Frequency is collapsing fastest in the At-Risk segment — visits per month down across 3 consecutive months.',
      next: 'Trigger win-back journeys for At-Risk customers with recency > 60 days before monetary value decays further.',
      severity: 'high',
    },
  };
}

function buildChurnRisk(): ChurnRiskRow[] {
  return buildRfmRows(60)
    .filter((r) => r.segmentId === 'at_risk' || r.segmentId === 'frequent' || r.recencyDays > 45)
    .slice(0, 28)
    .map((r, i) => {
      const rr = rng(700 + i * 13);
      return {
        customerId: r.customerId,
        segment: r.segmentId.replace('_', ' '),
        riskScore: round(between(rr, 52, 94)),
        recencyTrend: `+${round(between(rr, 8, 46))} days`,
        frequencyChangePct: round(-between(rr, 6, 44), 1),
        monetaryChangePct: round(-between(rr, 4, 38), 1),
        categoryDiversityChangePct: round(-between(rr, 2, 30), 1),
        visitsPerMonth: round(between(rr, 0.3, 1.8), 1),
      };
    })
    .sort((a, b) => b.riskScore - a.riskScore);
}

function buildTrends(): CustomerTrendPoint[] {
  const r = rng(31337);
  return lastNDays(52).map((date, i) => {
    const base = 8_200 + i * 22;
    const weekend = new Date(date).getUTCDay();
    const w = weekend === 0 || weekend === 6 ? 1.16 : 1;
    return {
      date,
      active: round(base * w * between(r, 0.95, 1.06)),
      new: round(between(r, 380, 760) * w),
      repeat: round(base * w * between(r, 0.58, 0.7)),
      churned: Math.round(between(r, 140, 420)),
    };
  });
}

export function buildCustomers(): CustomerAnalytics {
  const segments = buildSegments();
  const rfm = buildRfm();
  const rows = rfm.rows;
  return {
    segments,
    rfm,
    churnRisk: buildChurnRisk(),
    trends: buildTrends(),
    topCustomers: rows.slice(0, 25),
    promoSensitive: rows.filter((r) => r.segmentId === 'promotion_driven').slice(0, 20),
    narrative: {
      happened: `${segments[0].customers.toLocaleString()} High-Value Loyal customers drive ${segments[0].revenueSharePct}% of revenue.`,
      why: 'RFM shows monetary value concentrated in frequency band 4–5; At-Risk recency is lengthening fastest.',
      next: 'Convert Promotion-Driven visits into margin-positive habits; start churn intervention on the top 100 risk scores.',
      severity: 'high',
    },
  };
}

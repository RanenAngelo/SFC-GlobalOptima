/**
 * DEVELOPMENT / DEMO DATA — inventory & wastage (Steps 23, 24, 45).
 */

import { InventorySnapshot, WastageAnalytics, WastageBreakdown, WastageSummary, WastageTopItem, WastageRiskRow } from '../../api/types';
import { between, lastNDays, round, rng } from './_util';
import { CATEGORIES, ITEMS, LOCATIONS } from './catalog';

function buildSummary(): WastageSummary {
  const r = rng(707);
  const trend = lastNDays(90).map((date) => ({
    date,
    value: round(between(r, 380, 760)),
  }));
  return {
    totalKg: round(trend.reduce((s, t) => s + t.value, 0)),
    totalCost: round(trend.reduce((s, t) => s + t.value, 0) * 410),
    wastagePctOfPrep: round(between(r, 4.6, 6.8), 1),
    trend,
  };
}

function buildTopItems(): WastageTopItem[] {
  return ITEMS.map((it, i) => {
    const r = rng(800 + i * 11);
    const kg = it.flags.includes('Popular dish with excessive wastage') ? between(r, 720, 1_180) : between(r, 40, 640);
    return {
      id: it.id,
      name: it.name,
      kg: round(kg),
      cost: round(kg * between(r, 280, 520)),
      pctOfPrep: round(between(r, 1.2, 13.4), 1),
      trendPct: round(between(r, -9, 26), 1),
    };
  })
    .sort((a, b) => b.kg - a.kg)
    .slice(0, 12);
}

function buildRisk(): WastageRiskRow[] {
  const rows: WastageRiskRow[] = [];
  const r = rng(909);
  for (let i = 0; i < 6; i++) {
    const it = ITEMS[(i * 9 + 3) % ITEMS.length];
    rows.push({
      id: it.id, name: it.name, scope: 'item',
      riskScore: round(between(r, 62, 95)),
      predictedKg: round(between(r, 60, 320)),
      drivers: ['Historical demand', 'Weekend seasonality', 'Prep quantity', 'Promotion calendar'],
    });
  }
  ['2026-10-03', '2026-10-04', '2026-10-10'].forEach((d, i) => {
    rows.push({
      id: `T${i}`, name: `Period ${d}`, scope: 'period',
      riskScore: round(between(r, 58, 88)),
      predictedKg: round(between(r, 90, 420)),
      drivers: ['Forecast demand spike', 'Prep plan unchanged', 'Day-of-week pattern'],
    });
  });
  LOCATIONS.slice(0, 3).forEach((l, i) => {
    rows.push({
      id: l.id, name: l.name, scope: 'location',
      riskScore: round(between(r, 55, 82)),
      predictedKg: round(between(r, 140, 560)),
      drivers: ['Location peak mismatch', 'Inventory consumption pattern'],
    });
  });
  return rows.sort((a, b) => b.riskScore - a.riskScore);
}

function buildBreakdowns(): WastageBreakdown[] {
  const r = rng(1111);
  const mk = (dimension: WastageBreakdown['dimension'], labels: string[]): WastageBreakdown => ({
    dimension,
    rows: labels.map((label) => ({
      label,
      kg: round(between(r, 60, 980)),
      cost: round(between(r, 18_000, 420_000)),
    })),
  });
  return [
    mk('category', [...CATEGORIES]),
    mk('day', ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']),
    mk('location', LOCATIONS.slice(0, 8).map((l) => l.name)),
    mk('period', ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep']),
    mk('demand', ['Low demand', 'Normal', 'High demand', 'Peak']),
    mk('inventory', ['Within reorder', 'Low stock', 'Overstock']),
    mk('promotion', ['No promo', 'Active promo', 'Post-promo']),
    mk('prep', ['Under-prepared', 'Balanced', 'Over-prepared']),
  ];
}

export function buildWastage(): WastageAnalytics {
  const byLocation = LOCATIONS.slice(0, 12).map((l) => {
    const r = rng(l.id.charCodeAt(2) * 37 + l.id.charCodeAt(1));
    const kg = between(r, 420, 3_100);
    return { location: l.name, kg: round(kg), cost: round(kg * between(r, 300, 480)), pctOfPrep: round(between(r, 2.4, 9.8), 1) };
  }).sort((a, b) => b.kg - a.kg);

  return {
    summary: buildSummary(),
    topItems: buildTopItems(),
    byLocation,
    risk: buildRisk(),
    breakdowns: buildBreakdowns(),
    narrative: {
      happened: 'Wastage cost is concentrated in 5 items and 3 locations, spiking on weekends.',
      why: 'Over-preparation meets demand drops on shoulder days; promotion periods amplify preparation without matching sell-through.',
      next: 'Cut prep quantities on flagged items before the weekend and re-run wastage-risk after the forecast refresh.',
      severity: 'high',
    },
  };
}

export function buildInventory(): InventorySnapshot[] {
  return ITEMS.slice(0, 22).map((it, i) => {
    const r = rng(1234 + i * 19);
    const onHand = round(between(r, 8, 340));
    const days = round(between(r, 0.4, 12), 1);
    const reorder = round(between(r, 30, 120));
    return {
      id: it.id,
      item: it.name,
      onHand,
      unit: 'kg',
      daysOfSupply: days,
      reorderPoint: reorder,
      status: days < 1.5 ? 'critical' : days < 3 || onHand < reorder ? 'low' : 'ok',
    };
  });
}

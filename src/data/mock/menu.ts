/**
 * DEVELOPMENT / DEMO DATA — menu intelligence (Steps 9–11, 32, 43).
 */

import { MenuClassification, MenuItemPerformance, PerformanceClass, SlowMovingItem } from '../../api/types';
import { between, filterScale, round, rng } from './_util';
import { ITEMS } from './catalog';

export function buildMenuItems(): MenuItemPerformance[] {
  return ITEMS.map((it, i) => {
    const r = rng(1000 + i * 17);
    const price = it.basePrice;
    const volume =
      it.classification === 'profit_driver' ? between(r, 6_000, 14_000) :
      it.classification === 'volume_driver' ? between(r, 9_000, 21_000) :
      it.classification === 'hidden_opportunity' ? between(r, 1_200, 3_400) :
      between(r, 400, 1_600);

    const promoDep = it.flags.includes('Promotion-dependent dish') ? between(r, 55, 72) : between(r, 6, 34);
    const wastage = it.flags.includes('Popular dish with excessive wastage') ? between(r, 9.5, 14) : between(r, 0.6, 7.4);
    const rating = it.flags.includes('Low-rated dish with high sales')
      ? between(r, 2.9, 3.4)
      : between(r, 3.7, 4.9);
    const repeat = between(r, 12, 46);

    let cost = it.baseCost;
    if (it.flags.includes('High-selling but loss-making')) cost = price * between(r, 1.06, 1.22);
    if (it.flags.includes('Highly rated dish with poor profitability')) cost = price * between(r, 0.9, 0.97);

    const revenue = volume * price;
    const costTotal = volume * cost;
    const contribution = revenue - costTotal;
    const profitPct = (contribution / revenue) * 100;

    const classification: PerformanceClass =
      it.flags.includes('High-selling but loss-making') ? 'volume_driver'
      : it.flags.includes('Highly profitable but rarely purchased') ? 'hidden_opportunity'
      : it.flags.includes('New menu item with insufficient history') ? 'hidden_opportunity'
      : it.classification;

    return {
      id: it.id,
      name: it.name,
      category: it.category,
      quantitySold: Math.round(volume),
      revenue: round(revenue),
      cost: round(costTotal),
      contributionMargin: round(contribution),
      profitPct: round(profitPct, 1),
      rating: round(rating, 1),
      ratingCount: Math.round(volume * between(r, 0.05, 0.2)),
      repeatPurchaseRate: round(repeat, 1),
      wastagePct: round(wastage, 1),
      promotionDependency: round(promoDep, 1),
      salesTrendPct: round(between(r, -14, 22), 1),
      classification,
      flags: it.flags,
    };
  });
}

export function buildMenuClassification(f: { performanceClass?: string } = {}): MenuClassification {
  let items = buildMenuItems();
  if (f.performanceClass && f.performanceClass !== 'all') {
    items = items.filter((m) => m.classification === f.performanceClass);
  }
  const counts: Record<PerformanceClass, number> = {
    profit_driver: 0, volume_driver: 0, hidden_opportunity: 0, low_performer: 0,
  };
  for (const m of buildMenuItems()) counts[m.classification] += 1;

  return {
    items,
    counts,
    narrative: {
      happened: `${counts.profit_driver} Profit Drivers generate the majority of contribution margin; ${counts.low_performer} items drag the menu down.`,
      why: 'Classification blends volume, margin, rating, repeat purchase, wastage and promotion dependency — volume alone never qualifies an item as successful.',
      next: 'Promote Hidden Opportunities, redesign persistent Low Performers, and defend Profit Driver availability at peak hours.',
      severity: 'medium',
    },
  };
}

export function buildSlowMoving(f: { category?: string } = {}): SlowMovingItem[] {
  let rows = buildMenuItems()
    .filter((m) => m.classification === 'low_performer' || m.flags.length > 0 || m.salesTrendPct < -6)
    .sort((a, b) => a.quantitySold - b.quantitySold);
  if (f.category) rows = rows.filter((m) => m.category === f.category);

  return rows.slice(0, 14).map((m) => {
    const factors = [
      { name: 'Low sales volume', value: round(Math.min(100, (1 - m.quantitySold / 21000) * 100)), weight: 0.22 },
      { name: 'Low purchase frequency', value: round(100 - m.repeatPurchaseRate * 1.6), weight: 0.16 },
      { name: 'Long gaps between purchases', value: round(90 - m.salesTrendPct), weight: 0.14 },
      { name: 'Low repeat purchase', value: round(100 - m.repeatPurchaseRate * 2), weight: 0.14 },
      { name: 'High wastage', value: round(Math.min(100, m.wastagePct * 9)), weight: 0.12 },
      { name: 'Weak profitability', value: round(Math.max(0, 70 - m.profitPct)), weight: 0.12 },
      { name: 'Weak trend', value: round(Math.max(0, 60 - m.salesTrendPct * 2)), weight: 0.10 },
    ];
    const score = round(factors.reduce((s, x) => s + x.value * x.weight, 0));
    return { id: m.id, name: m.name, category: m.category, compositeScore: score, factors };
  });
}

/** Applies coarse menu filters used by the mock adapter. */
export function filterMenuRows(rows: MenuItemPerformance[], f: Record<string, unknown>): MenuItemPerformance[] {
  let out = rows;
  const sc = f as { category?: string; menuItem?: string; performanceClass?: string; ratingMin?: number; ratingMax?: number; wastageMin?: number; wastageMax?: number; priceMin?: number; priceMax?: number };
  if (sc.category) out = out.filter((r) => r.category === sc.category);
  if (sc.menuItem) out = out.filter((r) => r.id === sc.menuItem);
  if (sc.performanceClass && sc.performanceClass !== 'all') out = out.filter((r) => r.classification === sc.performanceClass);
  if (typeof sc.ratingMin === 'number') out = out.filter((r) => r.rating >= (sc.ratingMin as number));
  if (typeof sc.ratingMax === 'number') out = out.filter((r) => r.rating <= (sc.ratingMax as number));
  if (typeof sc.wastageMin === 'number') out = out.filter((r) => r.wastagePct >= (sc.wastageMin as number));
  if (typeof sc.wastageMax === 'number') out = out.filter((r) => r.wastagePct <= (sc.wastageMax as number));
  if (typeof sc.priceMin === 'number') out = out.filter((r) => r.revenue / Math.max(1, r.quantitySold) >= (sc.priceMin as number));
  if (typeof sc.priceMax === 'number') out = out.filter((r) => r.revenue / Math.max(1, r.quantitySold) <= (sc.priceMax as number));
  return out;
}

export function scaleByFilters<T extends { revenue?: number; quantitySold?: number }>(rows: T[], f: Record<string, unknown>): T[] {
  const key = JSON.stringify(f);
  const s = filterScale(key);
  if (s === 1) return rows;
  return rows.map((r) => ({
    ...r,
    ...(r.revenue !== undefined ? { revenue: round(r.revenue * s) } : {}),
    ...(r.quantitySold !== undefined ? { quantitySold: round(r.quantitySold * s) } : {}),
  }));
}

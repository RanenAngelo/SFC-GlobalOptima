/**
 * DEVELOPMENT / DEMO DATA — pricing & promotions (Steps 25–28).
 */

import { PriceHistoryPoint, PricingAnalytics, PriceSensitivityRow, PromotionAnalytics, PromotionRow, PromotionTrap } from '../../api/types';
import { between, isoDay, round, rng } from './_util';
import { ITEMS, PROMOTIONS } from './catalog';

export function buildPricing(): PricingAnalytics {
  const r = rng(2525);

  const items: PriceSensitivityRow[] = ITEMS.slice(0, 32).map((it, i) => {
    const rr = rng(400 + i * 23);
    const price = it.basePrice;
    const prevPrice = round(price * between(rr, 0.9, 1.14), 2);
    const elasticity = round(-between(rr, 0.15, 2.4), 2);
    const sensitivity: PriceSensitivityRow['sensitivity'] =
      elasticity <= -1.5 ? 'high' : elasticity <= -0.8 ? 'moderate' : 'low';
    const demandChangeAfterPriceChangePct = round(
      elasticity * ((price - prevPrice) / prevPrice) * 100, 1,
    );
    const history: PriceHistoryPoint[] = Array.from({ length: 8 }, (_, k) => ({
      date: isoDay(-(8 - k) * 42),
      price: round(price * between(rr, 0.88, 1.1), 2),
    }));
    history.push({ date: isoDay(0), price });
    return {
      id: it.id,
      name: it.name,
      price,
      prevPrice,
      elasticity,
      sensitivity,
      demandChangeAfterPriceChangePct,
      marginPct: round(between(rr, 18, 72), 1),
      priceHistory: history,
    };
  });

  return {
    priceDemandCorrelation: round(-between(r, 0.31, 0.68), 2),
    items,
    repricingCandidates: items
      .filter((i) => i.sensitivity === 'low' && i.marginPct < 55)
      .slice(0, 5)
      .map((i) => ({
        id: i.id, name: i.name,
        suggestion: `Test +${round(between(rng(1), 3, 8))}% — demand is price-insensitive and margin is below menu average.`,
        estImpactPct: round(between(rng(2), 2, 7), 1),
      })),
    narrative: {
      happened: 'Demand shows a moderate negative correlation with price; sensitivity is concentrated in burgers and beverages.',
      why: 'Elasticity estimated from historical price-change windows, controlling for promotions and channel mix.',
      next: 'Raise prices only on low-sensitivity, sub-parity-margin items; review high-sensitivity items for value framing instead.',
      severity: 'medium',
    },
  };
}

function trap(kind: string, detail: string): PromotionTrap {
  return { id: Math.random().toString(36).slice(2, 8), kind, detail };
}

export function buildPromotions(): PromotionAnalytics {
  const rows: PromotionRow[] = PROMOTIONS.map((p, i) => {
    const r = rng(880 + i * 37);
    const revLift = round(between(r, -4, 38), 1);
    const marginChange = round(between(r, -14, 12), 1);
    const wastageChange = round(between(r, -6, 24), 1);
    const newCust = Math.round(between(r, 220, 4_200));
    const traps: PromotionTrap[] = [];

    if (revLift > 5 && marginChange < -3) {
      traps.push(trap('Sales increase, but profit decreases', `Revenue +${revLift}% while margin moved ${marginChange}%.`));
    }
    if (newCust > 2_500 && marginChange < -5) {
      traps.push(trap('Customer count increases but average margin collapses', `+${newCust} customers, margin ${marginChange}%.`));
    }
    if (wastageChange > 10) {
      traps.push(trap('Promotion increases wastage', `Wastage rose ${wastageChange}% during the campaign.`));
    }
    if (i % 3 === 1) {
      traps.push(trap('Customers purchase only while discounts are active', 'Repeat rate collapses to baseline within 9 days post-promo.'));
    }
    if (i % 4 === 2) {
      traps.push(trap('Promotion shifts sales away from a more profitable product', 'Bundle cannibalised a Profit Driver main at 3 locations.'));
    }

    const effectiveness: PromotionRow['effectiveness'] =
      traps.length >= 2 ? 'ineffective' : traps.length === 1 || marginChange < 0 ? 'mixed' : 'effective';

    return {
      id: p.id,
      name: p.name,
      type: p.type,
      start: isoDay(-between(r, 30, 150)),
      end: isoDay(-between(r, 1, 29)),
      orderVolumeLiftPct: round(between(r, -6, 44), 1),
      revenueLiftPct: revLift,
      marginChangePct: marginChange,
      newCustomers: newCust,
      repeatRatePct: round(between(r, 14, 52), 1),
      aovChangePct: round(between(r, -9, 11), 1),
      wastageChangePct: wastageChange,
      postPromoRetentionPct: round(between(r, 18, 74), 1),
      effectiveness,
      traps,
    };
  });

  return {
    promotions: rows,
    trapsDetected: rows.flatMap((p) => p.traps.map((t) => ({ promotion: p.name, trap: t }))),
    narrative: {
      happened: `${rows.filter((p) => p.effectiveness === 'ineffective').length} promotions are hurting profitability despite lifting sales.`,
      why: 'Effectiveness weighs margin, acquisition, repeat behavior, AOV, wastage and post-promo retention — not sales lift alone.',
      next: 'Retire or redesign trap-flagged campaigns before the next promotional window.',
      severity: 'critical',
    },
  };
}

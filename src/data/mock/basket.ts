/**
 * DEVELOPMENT / DEMO DATA — market basket (Steps 17, 18).
 */

import { BundleSuggestion, BasketRule, MarketBasketAnalytics } from '../../api/types';
import { round, rng, between } from './_util';
import { ITEMS } from './catalog';

function itemName(id: string): string {
  return ITEMS.find((i) => i.id === id)?.name ?? id;
}

export function buildBasket(): MarketBasketAnalytics {
  const raw: Array<[string, string, number, number, number]> = [
    ['M013', 'M020', 0.084, 0.61, 3.2],
    ['M017', 'M045', 0.071, 0.55, 2.8],
    ['M024', 'M035', 0.065, 0.48, 2.4],
    ['M001', 'M046', 0.093, 0.42, 1.9],
    ['M030', 'M040', 0.058, 0.66, 3.6],
    ['M048', 'M054', 0.112, 0.71, 4.1],
    ['M032', 'M052', 0.047, 0.52, 2.6],
    ['M005', 'M036', 0.069, 0.44, 2.1],
    ['M012', 'M020', 0.054, 0.39, 1.8],
    ['M013', 'M046', 0.061, 0.37, 1.7],
    ['M057', 'M061', 0.043, 0.68, 3.4],
    ['M024', 'M045', 0.051, 0.41, 2.0],
    ['M030', 'M035', 0.077, 0.58, 2.9],
    ['M048', 'M052', 0.039, 0.46, 2.3],
    ['M017', 'M046', 0.066, 0.49, 2.5],
    ['M005', 'M061', 0.058, 0.53, 2.7],
  ];

  const rules: BasketRule[] = raw.map(([a, b, s, c, l], i) => ({
    id: `R${String(i + 1).padStart(3, '0')}`,
    antecedent: [itemName(a)],
    consequent: [itemName(b)],
    support: round(s, 3),
    confidence: round(c, 2),
    lift: round(l, 2),
  }));

  const bundles: BundleSuggestion[] = [
    { id: 'B1', name: 'Smash & Fries Combo', items: [itemName('M013'), itemName('M045'), itemName('M046')], type: 'combo', evidence: rules[0], estLiftPct: 12 },
    { id: 'B2', name: 'Grill Night Cross-Sell', items: [itemName('M030'), itemName('M040')], type: 'cross_sell', evidence: rules[4], estLiftPct: 9 },
    { id: 'B3', name: 'Dessert Upsell Pairing', items: [itemName('M048'), itemName('M054')], type: 'upsell', evidence: rules[5], estLiftPct: 15 },
    { id: 'B4', name: 'Coffee & Cake Ritual', items: [itemName('M057'), itemName('M061')], type: 'pairing', evidence: rules[10], estLiftPct: 11 },
  ];

  // network for visualization
  const nodeIds = new Set<string>();
  raw.forEach(([a, b]) => { nodeIds.add(a); nodeIds.add(b); });
  const nodes = [...nodeIds].map((id) => ({
    id,
    label: itemName(id),
    weight: raw.filter(([a, b]) => a === id || b === id).reduce((s, [, , su]) => s + su, 0),
  }));
  const links = rules.map((r) => {
    const pair = raw.find(([a, b]) => itemName(a) === r.antecedent[0] && itemName(b) === r.consequent[0])!;
    return { source: pair[0], target: pair[1], lift: r.lift };
  });

  return {
    rules,
    bundles,
    network: { nodes, links },
    narrative: {
      happened: `${rules.filter((r) => r.lift >= 2.5).length} item pairings show lift above 2.5× — customers bundle these far more than chance.`,
      why: 'Association rules (support / confidence / lift) built from 1M+ order lines on equivalent Spark & Python pipelines.',
      next: 'Launch the Dessert Upsell pair as a one-click combo in the Website / App channel where basket size is smallest.',
      severity: 'medium',
    },
  };
}

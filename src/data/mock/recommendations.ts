/**
 * DEVELOPMENT / DEMO DATA — recommendation engine (Steps 37–39).
 * Every recommendation MUST carry evidence (Step 38) and a priority.
 */

import { Priority, Recommendation, RecommendationFeed } from '../../api/types';

const REC: Recommendation[] = [
  {
    id: 'REC001', category: 'menu', priority: 'high',
    action: 'Promote Item M042 (Cold Brew Float) in loyalty campaigns',
    reason: ['Contribution margin 68%', '4.7 average rating across 2,140 ratings', 'Wastage below 1.5% of prep', 'Current order frequency in the bottom tercile', 'Repeat purchase 41% among existing buyers'],
    impactEstimate: '+6–9% category revenue, minimal cannibalisation',
    relatedEntity: 'M042',
  },
  {
    id: 'REC002', category: 'inventory', priority: 'critical',
    action: 'Reduce preparation quantity of Truffle Fries before weekends',
    reason: ['Wastage 12.4% of prep — highest on the menu', 'Weekend over-prep pattern in 8 of 10 weeks', 'Forecast demand flat while prep plan still elevated'],
    impactEstimate: '−₨ 180K monthly wastage cost',
    relatedEntity: 'M045',
  },
  {
    id: 'REC003', category: 'pricing', priority: 'high',
    action: 'Reprice 5 low-sensitivity items above menu-average margin parity',
    reason: ['Elasticity between −0.3 and −0.7 (low sensitivity)', 'Margin 6–11 pts below menu average', 'Demand stable through last two price windows'],
    impactEstimate: '+2.5–4% contribution margin',
  },
  {
    id: 'REC004', category: 'promotion', priority: 'critical',
    action: 'Suspend or redesign "Late Night 20%" campaign',
    reason: ['Revenue +9% but contribution margin −6.4%', 'Post-promo retention only 21%', 'Wastage +14% during campaign windows', 'Cannibalised a Profit Driver main'],
    impactEstimate: 'Protects ~₨ 420K margin per cycle',
    relatedEntity: 'P03',
  },
  {
    id: 'REC005', category: 'menu', priority: 'medium',
    action: 'Bundle Seafood Linguine with Lemon Butter Salmon as a cross-sell',
    reason: ['Association lift 3.6×', 'Confidence 0.66 on 4,800+ baskets', 'Both items show stable repeat purchase'],
    impactEstimate: '+9–12% attach-rate revenue',
  },
  {
    id: 'REC006', category: 'customer', priority: 'high',
    action: 'Launch win-back journey for top-100 At-Risk customers',
    reason: ['Recency +46 days average', 'Frequency −34% month-over-month', 'Monetary value declining for 3 consecutive periods', 'Historical win-back response 18%'],
    impactEstimate: 'Recover ₨ 1.1–1.6M quarterly revenue',
  },
  {
    id: 'REC007', category: 'inventory', priority: 'high',
    action: 'Increase stock ahead of the 3–4 Oct predicted demand surge',
    reason: ['Forecast +18% vs trailing weekend', 'Capacity index 1.28 at Clifton', 'Two key SKUs near reorder point'],
    impactEstimate: 'Avoid ~4.2% stockout risk',
  },
  {
    id: 'REC008', category: 'menu', priority: 'medium',
    action: 'Redesign or delist persistent Low Performers (4 items)',
    reason: ['Composite slow-moving score > 70 for 2 consecutive months', 'Wastage above 8% of prep', 'Ratings below 3.6 with declining trend'],
    impactEstimate: '+1.4 pts average menu margin',
  },
  {
    id: 'REC009', category: 'location', priority: 'high',
    action: 'Investigate Marine Drive sales anomaly before acting on its +64% spike',
    reason: ['Deviation 4.8σ outside control band', 'Coincides with unusual discounting', 'Duplicate transaction fingerprints detected'],
    impactEstimate: 'Prevents erroneous demand baseline',
  },
  {
    id: 'REC010', category: 'customer', priority: 'medium',
    action: 'Target Promotion-Driven segment with margin-protected bundles',
    reason: ['15% of customers, 14% of revenue', 'Discount dependency > 60% of orders', 'AOV responds positively to bundle framing'],
    impactEstimate: '+3–5 pts margin on segment',
  },
  {
    id: 'REC011', category: 'operations', priority: 'low',
    action: 'Shift grill-line prep start 30 minutes earlier on Fri–Sun',
    reason: ['Dinner peak 19–22h dominates weekend orders', 'Average ticket time rises 6 min in peak window'],
    impactEstimate: '−8% peak wait-time proxy',
  },
  {
    id: 'REC012', category: 'promotion', priority: 'medium',
    action: 'Double down on "Weekend Grill BOGO" with margin guardrails',
    reason: ['Revenue +24%, margin held positive', 'New customers retained at 61% after 30 days', 'No wastage escalation detected'],
    impactEstimate: '+1.8% monthly profit contribution',
    relatedEntity: 'P04',
  },
];

export function buildRecommendations(): RecommendationFeed {
  const byPriority: Record<Priority, number> = { low: 0, medium: 0, high: 0, critical: 0 };
  REC.forEach((r) => (byPriority[r.priority] += 1));
  return {
    items: REC,
    byPriority,
    narrative: {
      happened: `${byPriority.critical} critical and ${byPriority.high} high-priority actions are waiting for management review.`,
      why: 'Each action cites the analytical evidence that produced it — no unexplained recommendations.',
      next: 'Clear critical items first: promotion redesign and weekend prep reduction carry the largest margin impact.',
      severity: 'critical',
    },
  };
}

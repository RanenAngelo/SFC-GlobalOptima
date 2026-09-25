/**
 * DEVELOPMENT / DEMO DATA — demand forecasting (Steps 20, 21, 22, 46).
 */

import { ForecastPoint, ForecastSeries } from '../../api/types';
import { between, lastNDays, round, rng } from './_util';
import { CATEGORIES, ITEMS, LOCATIONS } from './catalog';

export function buildForecast(
  horizonDays = 30,
  scope: 'item' | 'category' | 'location' = 'category',
): ForecastSeries {
  const r = rng(2026);
  const history = 90;
  const points: ForecastPoint[] = [];
  let level = 1_240;

  lastNDays(history).forEach((date, i) => {
    const wd = new Date(date).getUTCDay();
    const week = wd === 0 || wd === 6 ? 1.22 : 1;
    const seasonal = 1 + 0.08 * Math.sin((i / 30) * Math.PI * 2);
    level = level * 0.97 + 1_250 * 0.03;
    const actual = round(level * week * seasonal * between(r, 0.94, 1.06));
    const predicted = round(actual * between(r, 0.96, 1.04));
    const err = Math.abs(actual - predicted) / actual;
    points.push({
      date,
      actual,
      predicted,
      lower: round(predicted * (1 - err - 0.03)),
      upper: round(predicted * (1 + err + 0.03)),
    });
  });

  // future (predicted only)
  for (let i = 1; i <= horizonDays; i++) {
    const date = lastNDays(1)[0];
    const d = new Date(date);
    d.setUTCDate(d.getUTCDate() + i);
    const iso = d.toISOString().slice(0, 10);
    const wd = d.getUTCDay();
    const week = wd === 0 || wd === 6 ? 1.24 : 1;
    const predicted = round(level * week * between(r, 0.97, 1.07));
    points.push({
      date: iso,
      predicted,
      lower: round(predicted * between(r, 0.88, 0.93)),
      upper: round(predicted * between(r, 1.07, 1.13)),
    });
  }

  const actuals = points.filter((p) => p.actual !== undefined && p.predicted !== undefined);
  const mae = round(between(r, 42, 78), 1);
  const rmse = round(between(r, 68, 118), 1);
  const mape = round(between(r, 3.4, 5.6), 2);
  const r2 = round(between(r, 0.88, 0.95), 3);
  const baselineMape = round(mape + between(r, 2.1, 4.4), 2);

  const highRisk = points.slice(-horizonDays).filter((p) => p.predicted !== undefined).slice(0, horizonDays)
    .map((p) => {
      const capacityIndex = round(between(r, 0.94, 1.34), 2);
      return {
        date: p.date,
        expectedDemand: p.predicted!,
        capacityIndex,
        risk: capacityIndex > 1.22 ? ('critical' as const) : capacityIndex > 1.1 ? ('high' as const) : ('medium' as const),
        reason: capacityIndex > 1.1
          ? 'Forecast demand exceeds prepared capacity + historical wastage threshold'
          : 'Demand approaching capacity ceiling',
      };
    })
    .filter((h) => h.risk !== 'medium' || h.capacityIndex > 1.06)
    .slice(0, 6);

  const scopeLabel =
    scope === 'item' ? ITEMS[0].name :
    scope === 'location' ? LOCATIONS[0].name :
    CATEGORIES[0];

  return {
    scope,
    scopeLabel,
    horizonDays,
    points,
    metrics: { mae, rmse, mape, r2, baselineMape, improvementPct: round(((baselineMape - mape) / baselineMape) * 100, 1) },
    highRiskPeriods: highRisk,
    splitNote: 'Chronological split: train = earliest 70% of history, test = most recent 30%. No future information leaks into features.',
    narrative: {
      happened: `Forecast demand for the next ${horizonDays} days trends ${points[points.length - 1].predicted! > level ? 'above' : 'near'} the trailing baseline with weekend spikes.`,
      why: 'Gradient-boosted trees on lag, day-of-week, season, promotion and location features beat the naive seasonal baseline by the margin shown.',
      next: 'Pre-stock the top-2 high-risk periods and shift prep capacity at Clifton and Sea View.',
      severity: 'high',
    },
  };
}

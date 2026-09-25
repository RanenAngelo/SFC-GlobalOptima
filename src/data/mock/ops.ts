/**
 * DEVELOPMENT / DEMO DATA — data quality, Spark jobs, reports, audit (Steps 4, 5, 49, 50, FR lxiii–lxv).
 */

import { AuditEntry, DataQualityReport, ReportDescriptor, ReportKind, SparkJob } from '../../api/types';
import { between, round, rng } from './_util';
import { buildMenuItems } from './menu';
import { buildLocations } from './locations';
import { buildCustomers } from './customers';
import { buildRecommendations } from './recommendations';
import { buildWastage } from './wastage';
import { buildPromotions, buildPricing } from './pricing';
import { buildAnomalies, buildRatings } from './anomalies';
import { buildDualPipeline } from './dualpipe';
import { buildForecast } from './forecast';
import { buildBasket } from './basket';

export function buildDataQuality(): DataQualityReport {
  const r = rng(404);
  const issues = [
    { category: 'Missing values', severity: 'high' as const, rule: 'Column null-rate > 0.5%', action: 'Quarantine rows; impute categorical dims' },
    { category: 'Duplicate orders', severity: 'high' as const, rule: 'Same customer+items+timestamp within 60s', action: 'Keep first, mark duplicates' },
    { category: 'Duplicate order-line records', severity: 'medium' as const, rule: 'Exact line duplicates per Order ID', action: 'Deduplicate' },
    { category: 'Invalid menu prices', severity: 'critical' as const, rule: 'Price ≤ 0 or outside 3σ of history', action: 'Flag & replace with last-known price' },
    { category: 'Negative quantities', severity: 'critical' as const, rule: 'Quantity < 0', action: 'Reject line' },
    { category: 'Invalid dates', severity: 'high' as const, rule: 'Order date outside dataset range / future', action: 'Quarantine' },
    { category: 'Invalid ratings', severity: 'medium' as const, rule: 'Rating not in 1–5', action: 'Clamp & flag' },
    { category: 'Missing customer IDs', severity: 'medium' as const, rule: 'FK null', action: 'Assign guest bucket' },
    { category: 'Missing menu IDs', severity: 'medium' as const, rule: 'FK null', action: 'Reject line' },
    { category: 'Invalid restaurant IDs', severity: 'high' as const, rule: 'FK not in Restaurants', action: 'Quarantine' },
    { category: 'Impossible wastage quantities', severity: 'high' as const, rule: 'Wastage > prep quantity', action: 'Cap at prep qty, flag' },
    { category: 'Incorrect discounts', severity: 'medium' as const, rule: 'Discount > 80% or < 0', action: 'Clamp, flag campaign' },
    { category: 'Cancelled transactions', severity: 'low' as const, rule: 'Status = cancelled', action: 'Retain for analytics, exclude revenue' },
    { category: 'Inconsistent units', severity: 'medium' as const, rule: 'Unit label mismatch', action: 'Normalize to kg/ml' },
    { category: 'Invalid location references', severity: 'high' as const, rule: 'Location ID unknown', action: 'Quarantine' },
  ].map((i) => ({ ...i, count: Math.round(between(r, 12, 4_200)) }));

  return {
    scannedRows: 1_000_000 + Math.round(between(r, 40_000, 210_000)),
    passRatePct: round(between(r, 96.1, 98.9), 2),
    issues,
    cleaningDecisions: issues.slice(0, 8).map((i) => ({
      rule: i.rule,
      decision: i.action,
      recordsAffected: i.count,
    })),
    generatedAt: '2026-09-25T06:00:00Z',
  };
}

export function buildSparkJobs(): SparkJob[] {
  return [
    { id: 'JOB-1041', name: 'ingest_raw_orders', stage: 'Ingestion', status: 'succeeded', progressPct: 100, startedAt: '2026-09-25T04:10:00Z', durationMs: 82_400, rowsProcessed: 1_042_118, logTail: 'Partitioned write OK → parquet/orders' },
    { id: 'JOB-1042', name: 'data_quality_scan', stage: 'Quality', status: 'succeeded', progressPct: 100, startedAt: '2026-09-25T04:14:00Z', durationMs: 61_200, rowsProcessed: 1_042_118, logTail: '15 issue rules evaluated' },
    { id: 'JOB-1043', name: 'clean_and_quarantine', stage: 'Cleaning', status: 'succeeded', progressPct: 100, startedAt: '2026-09-25T04:17:00Z', durationMs: 44_800, rowsProcessed: 18_642 },
    { id: 'JOB-1044', name: 'integrate_multi_table', stage: 'Integration', status: 'succeeded', progressPct: 100, startedAt: '2026-09-25T04:20:00Z', durationMs: 120_500, rowsProcessed: 1_023_476, logTail: '10 joins executed via Spark SQL' },
    { id: 'JOB-1045', name: 'feature_engineering', stage: 'Features', status: 'succeeded', progressPct: 100, startedAt: '2026-09-25T04:26:00Z', durationMs: 97_300, rowsProcessed: 1_023_476, logTail: '22 analytical features materialized' },
    { id: 'JOB-1046', name: 'train_menu_classifier_mllib', stage: 'Spark MLlib', status: 'running', progressPct: 68, startedAt: '2026-09-25T06:02:00Z', logTail: 'RandomForest: 14/20 trees' },
    { id: 'JOB-1047', name: 'forecast_demand_gbt', stage: 'Spark MLlib', status: 'running', progressPct: 34, startedAt: '2026-09-25T06:04:00Z', logTail: 'Iterating on chronological folds' },
    { id: 'JOB-1048', name: 'python_pipeline_compare', stage: 'Dual Pipeline', status: 'queued', progressPct: 0, startedAt: '2026-09-25T06:05:00Z', logTail: 'Waiting for MLlib artifacts' },
    { id: 'JOB-1039', name: 'parquet_compact', stage: 'Storage', status: 'failed', progressPct: 61, startedAt: '2026-09-25T03:50:00Z', durationMs: 21_000, logTail: 'Executor lost: retryable (insufficient memory) — scheduled auto-retry' },
  ];
}

export function buildAuditLog(): AuditEntry[] {
  return [
    { id: 'E901', at: '2026-09-25T06:12:00Z', actor: 'system', action: 'model_score', target: 'menu-classifier v1.4.0' },
    { id: 'E902', at: '2026-09-25T05:58:00Z', actor: 'admin@dineiq.demo', action: 'export', target: 'reports/menu_performance.csv' },
    { id: 'E903', at: '2026-09-25T05:40:00Z', actor: 'analyst@dineiq.demo', action: 'what_if_simulate', target: 'M045 price −5%' },
    { id: 'E904', at: '2026-09-25T05:21:00Z', actor: 'system', action: 'spark_job', target: 'JOB-1043 succeeded' },
    { id: 'E905', at: '2026-09-25T04:55:00Z', actor: 'manager@dineiq.demo', action: 'login', target: 'session issued' },
  ];
}

export function buildReportDescriptors(): ReportDescriptor[] {
  const defs: { kind: ReportKind; name: string; description: string; rows: number }[] = [
    { kind: 'menu_performance', name: 'Menu Performance', description: 'Classification, margins, ratings, wastage per item', rows: 64 },
    { kind: 'profitability', name: 'Profitability', description: 'Revenue, cost, contribution margin analysis', rows: 64 },
    { kind: 'customer_segmentation', name: 'Customer Segmentation', description: 'Segments, RFM scores, churn risk', rows: 140 },
    { kind: 'market_basket', name: 'Market-Basket Analysis', description: 'Association rules with support / confidence / lift', rows: 16 },
    { kind: 'demand_forecast', name: 'Demand Forecast', description: 'Predicted demand with accuracy metrics', rows: 120 },
    { kind: 'wastage', name: 'Wastage', description: 'Wastage by item, location, period with risk scores', rows: 12 },
    { kind: 'promotions', name: 'Promotions', description: 'Effectiveness metrics and detected traps', rows: 8 },
    { kind: 'pricing', name: 'Pricing', description: 'Elasticity and price-sensitivity classification', rows: 32 },
    { kind: 'location_performance', name: 'Location Performance', description: 'Cross-location KPI comparison', rows: 24 },
    { kind: 'anomalies', name: 'Anomalies', description: 'Sales and rating anomalies with severity', rows: 30 },
    { kind: 'recommendations', name: 'Recommendations', description: 'Prioritized actions with evidence', rows: 12 },
    { kind: 'model_comparison', name: 'Spark vs Python Model Comparison', description: 'Record-level dual-pipeline agreement report', rows: 120 },
  ];
  return defs.map((d) => ({ ...d, formats: ['csv', 'xlsx'] }));
}

/** Builds tabular rows for a given report/export from the mock analysis layer. */
export function buildReportRows(kind: ReportKind): Record<string, unknown>[] {
  switch (kind) {
    case 'menu_performance':
      return buildMenuItems().map((m) => ({
        id: m.id, name: m.name, category: m.category, classification: m.classification,
        quantity: m.quantitySold, revenue: m.revenue, marginPct: m.profitPct,
        rating: m.rating, wastagePct: m.wastagePct, trendPct: m.salesTrendPct,
      }));
    case 'profitability':
      return buildMenuItems().map((m) => ({
        id: m.id, name: m.name, revenue: m.revenue, cost: m.cost,
        contributionMargin: m.contributionMargin, profitPct: m.profitPct,
      }));
    case 'customer_segmentation': {
      const { rfm, segments } = buildCustomers();
      return rfm.rows.map((r) => ({ ...r, segmentName: segments.find((s) => s.id === r.segmentId)?.name ?? r.segmentId }));
    }
    case 'market_basket':
      return buildBasket().rules.map((r) => ({
        id: r.id, antecedent: r.antecedent.join(' + '), consequent: r.consequent.join(' + '),
        support: r.support, confidence: r.confidence, lift: r.lift,
      }));
    case 'demand_forecast': {
      const f = buildForecast(30, 'category');
      return f.points.map((p) => ({ date: p.date, actual: p.actual ?? '', predicted: p.predicted ?? '', lower: p.lower ?? '', upper: p.upper ?? '' }));
    }
    case 'wastage':
      return buildWastage().topItems.map((w) => ({ id: w.id, name: w.name, kg: w.kg, cost: w.cost, pctOfPrep: w.pctOfPrep, trendPct: w.trendPct }));
    case 'promotions':
      return buildPromotions().promotions.map((p) => ({
        id: p.id, name: p.name, type: p.type, revenueLiftPct: p.revenueLiftPct,
        marginChangePct: p.marginChangePct, wastageChangePct: p.wastageChangePct,
        effectiveness: p.effectiveness, trapCount: p.traps.length,
      }));
    case 'pricing':
      return buildPricing().items.map((p) => ({
        id: p.id, name: p.name, price: p.price, prevPrice: p.prevPrice,
        elasticity: p.elasticity, sensitivity: p.sensitivity,
        demandChangePct: p.demandChangeAfterPriceChangePct, marginPct: p.marginPct,
      }));
    case 'location_performance':
      return buildLocations().map((l) => ({
        id: l.id, name: l.name, city: l.city, revenue: l.revenue, profit: l.profit,
        marginPct: l.marginPct, aov: l.aov, customers: l.customers,
        repeatRatePct: l.repeatRatePct, wastagePct: l.wastagePct, rating: l.rating,
      }));
    case 'anomalies':
      return [...buildAnomalies().sales, ...buildAnomalies().ratings].map((a) => ({
        id: a.id, date: a.date, kind: a.kind, entity: a.entity,
        severity: a.severity, observed: a.observed, deviationSigma: a.deviationSigma, resolved: a.resolved,
      }));
    case 'recommendations':
      return buildRecommendations().items.map((r) => ({
        id: r.id, priority: r.priority, category: r.category, action: r.action,
        evidence: r.reason.join(' | '), impact: r.impactEstimate,
      }));
    case 'model_comparison':
      return buildDualPipeline().rows.map((row) => ({
        recordId: row.recordId, actual: row.actual, sparkResult: row.sparkResult,
        pythonResult: row.pythonResult, match: row.match ? 'MATCH' : 'MISMATCH',
        numericDiff: row.numericDiff ?? '', explanation: row.explanation ?? '',
      }));
    default:
      return [];
  }
}

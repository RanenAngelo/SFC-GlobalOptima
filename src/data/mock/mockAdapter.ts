/**
 * MockAdapter — development data source implementing DineIQDataSource.
 *
 * DATA IS SYNTHETIC / DEMO ONLY. It mimics the shapes the real DineIQ
 * backend will return, so the UI can be finished before the external
 * backend contract is available. Swap via API_CONFIG.MODE later.
 */

import {
  AuthUser, CustomerAnalytics, DineIQDataSource, Filters, FilterOptions,
} from '../../api/types';
import { API_CONFIG } from '../../api/config';
import { buildOverview } from './overview';
import { buildMenuClassification, buildSlowMoving, filterMenuRows } from './menu';
import { buildCustomers, buildRfmRows } from './customers';
import { buildBasket } from './basket';
import { buildForecast } from './forecast';
import { buildWastage, buildInventory } from './wastage';
import { buildPricing, buildPromotions } from './pricing';
import { buildAnomalies, buildRatings } from './anomalies';
import { buildLocationsAnalytics, buildPeaks, buildRevenue, buildOrders } from './locations';
import { buildRecommendations } from './recommendations';
import { buildDualPipeline } from './dualpipe';
import { buildDataQuality, buildSparkJobs, buildAuditLog, buildReportDescriptors, buildReportRows } from './ops';
import { mockControls } from './controls';
import { CATEGORIES, CHANNELS, ITEMS, LOCATIONS, PROMOTIONS, SEGMENTS } from './catalog';
import { round } from './_util';

const DEMO_USER = {
  id: 'U-001',
  displayName: 'Ayesha Rahman',
  email: 'manager@dineiq.demo',
  role: 'manager' as const,
  locations: ['L01', 'L02'],
};

async function settle<T>(value: T): Promise<T> {
  const base = API_CONFIG.MOCK_LATENCY_MS;
  const delay = mockControls.slowMode ? base * 6 : base * (0.5 + Math.random() * 0.8);
  await new Promise((res) => setTimeout(res, delay));
  if (mockControls.failMode) {
    throw new Error('Unable to load this analysis. (mock failure mode enabled in Settings)');
  }
  if (mockControls.emptyMode) {
    // Return an "empty" shape — UI must show empty states, never fake numbers.
    return emptyify(value) as T;
  }
  return value;
}

/** Best-effort empty projection so empty states are truly empty. */
function emptyify(value: unknown): unknown {
  if (Array.isArray(value)) return [];
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (Array.isArray(v)) out[k] = [];
      else if (v && typeof v === 'object' && !Array.isArray(v)) out[k] = emptyify(v);
      else out[k] = v;
    }
    // keep scalar KPIs at 0 when they are numbers
    for (const [k, v] of Object.entries(out)) {
      if (typeof v === 'number' && k !== 'agreementPct' && k !== 'passRatePct') out[k] = 0;
    }
    return out;
  }
  return value;
}

/** Coarse filter response — slices time series and scales volumes consistently. */
function sliceSeries<T extends { date: string }>(rows: T[], f: Filters): T[] {
  if (!f.dateFrom && !f.dateTo) return rows;
  return rows.filter(
    (r) =>
      (!f.dateFrom || r.date >= f.dateFrom) && (!f.dateTo || r.date <= f.dateTo),
  );
}

function locationFactor(f: Filters): number {
  if (!f.location) return 1;
  const idx = LOCATIONS.findIndex((l) => l.id === f.location);
  if (idx < 0) return 1;
  return round(0.4 + ((idx * 37) % 60) / 100, 2);
}

export class MockAdapter implements DineIQDataSource {
  async login(email: string, _password: string) {
    await settle(null);
    const e = (email || DEMO_USER.email).toLowerCase();
    const role: AuthUser['role'] =
      e.includes('admin') ? 'administrator'
        : e.includes('analyst') ? 'analyst'
        : e.includes('regional') ? 'regional_manager'
        : 'manager';
    return {
      user: { ...DEMO_USER, email: e, role, displayName: role === 'administrator' ? 'Sofia Iqbal' : role === 'analyst' ? 'Bilal Ahmed' : role === 'regional_manager' ? 'Hina Sheikh' : 'Ayesha Rahman' },
      issuedAt: new Date().toISOString(),
    };
  }

  async logout() {
    try { localStorage.removeItem('dineiq.session'); } catch { /* ignore */ }
  }

  async getSession() {
    try {
      const raw = localStorage.getItem('dineiq.session');
      return raw ? (JSON.parse(raw) as never) : null;
    } catch {
      return null;
    }
  }

  async getDashboardOverview(f: Filters) {
    const data = await settle(buildOverview());
    const k = locationFactor(f);
    if (k !== 1) {
      data.kpis.revenue.value = round(data.kpis.revenue.value * k);
      data.kpis.profit.value = round(data.kpis.profit.value * k);
      data.kpis.orders.value = round(data.kpis.orders.value * k);
      data.kpis.activeCustomers.value = round(data.kpis.activeCustomers.value * k);
      data.kpis.repeatCustomers.value = round(data.kpis.repeatCustomers.value * k);
      data.kpis.wastageCost.value = round(data.kpis.wastageCost.value * k);
    }
    data.revenueTrend = sliceSeries(data.revenueTrend, f);
    data.orderTrend = sliceSeries(data.orderTrend, f);
    if (f.query) {
      const q = f.query.toLowerCase();
      data.topAlerts = data.topAlerts.filter((a) => (a.title + a.detail).toLowerCase().includes(q));
    }
    return data;
  }

  async getRevenueAnalytics(f: Filters) {
    const data = await settle(buildRevenue());
    data.series = sliceSeries(data.series, f);
    const k = locationFactor(f);
    if (k !== 1) {
      data.series = data.series.map((s) => ({ ...s, value: round(s.value * k) }));
      data.byCategory = data.byCategory.map((c) => ({ ...c, revenue: round(c.revenue * k), profit: round(c.profit * k) }));
    }
    if (f.category) data.byCategory = data.byCategory.filter((c) => c.name === f.category);
    data.totalRevenue = data.series.reduce((s, t) => s + t.value, 0);
    return data;
  }

  async getOrderAnalytics(f: Filters) {
    const data = await settle(buildOrders());
    data.series = sliceSeries(data.series, f);
    const k = locationFactor(f);
    if (k !== 1) data.series = data.series.map((s) => ({ ...s, value: round(s.value * k) }));
    data.totalOrders = data.series.reduce((s, t) => s + t.value, 0);
    return data;
  }

  async getPeakPeriodAnalytics(f: Filters) {
    const data = await settle(buildPeaks());
    if (f.channel) data.channelPeaks = data.channelPeaks.filter((c) => c.channel === f.channel);
    if (f.location) data.locationSpecificPeak = data.locationSpecificPeak.filter((p) => {
      const loc = LOCATIONS.find((l) => l.id === f.location);
      return loc ? p.location === loc.name : true;
    });
    return data;
  }

  async getForecastAnalytics(f: Filters, horizonDays: number, scope: 'item' | 'category' | 'location') {
    const data = await settle(buildForecast(horizonDays, scope));
    return data;
  }

  async getAnomalyAnalytics(f: Filters) {
    const data = await settle(buildAnomalies());
    if (f.location) {
      const loc = LOCATIONS.find((l) => l.id === f.location);
      if (loc) {
        data.sales = data.sales.filter((a) => a.entity === loc.name || Math.random() > 0.5);
        data.ratings = data.ratings.filter((a) => a.entity === loc.name || Math.random() > 0.5);
      }
    }
    data.timeline = sliceSeries(data.timeline, f);
    return data;
  }

  async getRatingAnalytics(f: Filters) {
    const data = await settle(buildRatings());
    data.trend = sliceSeries(data.trend, f);
    if (f.location) {
      const loc = LOCATIONS.find((l) => l.id === f.location);
      if (loc) data.byLocation = data.byLocation.filter((b) => b.location === loc.name);
    }
    return data;
  }

  async getLocationAnalytics(f: Filters) {
    const data = await settle(buildLocationsAnalytics());
    if (f.location) data.locations = data.locations.filter((l) => l.id === f.location);
    if (f.channel) data.channels = data.channels.filter((c) => c.channel === f.channel);
    return data;
  }

  async getMenuAnalytics(f: Filters) {
    const data = await settle(buildMenuClassification());
    const k = locationFactor(f);
    if (k !== 1) {
      data.items = data.items.map((i) => ({
        ...i,
        quantitySold: round(i.quantitySold * k),
        revenue: round(i.revenue * k),
        cost: round(i.cost * k),
        contributionMargin: round(i.contributionMargin * k),
      }));
    }
    data.items = filterMenuRows(data.items, f as Record<string, unknown>);
    if (f.query) {
      const q = f.query.toLowerCase();
      data.items = data.items.filter((i) => (i.name + i.category + i.id).toLowerCase().includes(q));
    }
    return data;
  }

  async getSlowMovingItems(f: Filters) {
    const rows = await settle(buildSlowMoving({ category: f.category }));
    const k = locationFactor(f);
    if (k !== 1) {
      return rows.map((m) => ({
        ...m,
        compositeScore: round(Math.min(100, Math.max(1, m.compositeScore * (1 + (1 - k) * 0.25)))),
      }));
    }
    return rows;
  }

  async getCustomerAnalytics(f: Filters): Promise<CustomerAnalytics> {
    const data = await settle(buildCustomers());
    const k = locationFactor(f);
    if (k !== 1) {
      data.segments = data.segments.map((s) => ({
        ...s,
        customers: round(s.customers * k),
      }));
      data.trends = data.trends.map((t) => ({
        ...t,
        active: round(t.active * k),
        new: round(t.new * k),
        repeat: round(t.repeat * k),
        churned: round(t.churned * k),
      }));
      data.rfm.rows = data.rfm.rows.map((r) => ({
        ...r,
        monetary: round(r.monetary * k),
      }));
    }
    if (f.segment) {
      data.segments = data.segments.filter((s) => s.id === f.segment || s.name.toLowerCase().replace(/[^a-z]+/g, '_') === f.segment);
      data.rfm.rows = data.rfm.rows.filter((r) => r.segmentId === f.segment);
      data.churnRisk = data.churnRisk.filter((c) => c.segment.replace(/\s+/g, '_') === f.segment);
      data.promoSensitive = data.promoSensitive.filter((r) => r.segmentId === f.segment);
      data.topCustomers = data.rfm.rows.slice(0, 25);
    }
    data.trends = sliceSeries(data.trends, f);
    if (f.dateFrom || f.dateTo) data.rfm.rows = data.rfm.rows; // RFM is point-in-time
    return data;
  }

  async getMarketBasketAnalytics(f: Filters) {
    const data = await settle(buildBasket());
    if (f.query) {
      const q = f.query.toLowerCase();
      data.rules = data.rules.filter(
        (r) => r.antecedent.join(' ').toLowerCase().includes(q) || r.consequent.join(' ').toLowerCase().includes(q),
      );
    }
    return data;
  }

  async getPricingAnalytics(f: Filters) {
    const data = await settle(buildPricing());
    const k = locationFactor(f);
    if (k !== 1) {
      data.items = data.items.map((i) => ({
        ...i,
        demandChangeAfterPriceChangePct: round(i.demandChangeAfterPriceChangePct * (1 + (1 - k) * 0.1)),
      }));
    }
    if (f.menuItem) data.items = data.items.filter((i) => i.id === f.menuItem);
    if (f.category) {
      const ids = new Set(ITEMS.filter((i) => i.category === f.category).map((i) => i.id));
      data.items = data.items.filter((i) => ids.has(i.id));
    }
    return data;
  }

  async getPromotionAnalytics(f: Filters) {
    const data = await settle(buildPromotions());
    if (f.promotion) {
      data.promotions = data.promotions.filter((p) => p.id === f.promotion);
      data.trapsDetected = data.trapsDetected.filter((t) => data.promotions.some((p) => p.name === t.promotion));
    }
    return data;
  }

  async getRecommendations(f: Filters) {
    const data = await settle(buildRecommendations());
    if (f.performanceClass && f.performanceClass !== 'all') {
      data.items = data.items.filter((r) => r.category === 'menu');
    }
    return data;
  }

  async getDualPipelineAnalytics(f: Filters) {
    const data = await settle(buildDualPipeline());
    if (f.query) {
      const q = f.query.toLowerCase();
      data.rows = data.rows.filter((r) =>
        [r.recordId, r.actual, r.sparkResult, r.pythonResult].join(' ').toLowerCase().includes(q),
      );
    }
    return data;
  }

  async getWastageAnalytics(f: Filters) {
    const data = await settle(buildWastage());
    data.summary.trend = sliceSeries(data.summary.trend, f);
    if (f.location) {
      const loc = LOCATIONS.find((l) => l.id === f.location);
      if (loc) data.byLocation = data.byLocation.filter((b) => b.location === loc.name);
    }
    if (f.category) data.topItems = data.topItems.filter((i) => ITEMS.find((x) => x.id === i.id)?.category === f.category);
    if (f.wastageMin !== undefined) data.topItems = data.topItems.filter((i) => i.pctOfPrep >= (f.wastageMin as number));
    if (f.wastageMax !== undefined) data.topItems = data.topItems.filter((i) => i.pctOfPrep <= (f.wastageMax as number));
    return data;
  }

  async getInventorySnapshot(f: Filters) {
    const rows = await settle(buildInventory());
    if (f.category) {
      const ids = new Set(ITEMS.filter((i) => i.category === f.category).map((i) => i.id));
      return rows.filter((r) => ids.has(r.id));
    }
    return rows;
  }

  /**
   * Scenario impact is computed HERE (mock layer) and always flagged as an
   * estimate. The real adapter will delegate this to the backend.
   */
  async simulateScenario(s: { action: string; magnitudePct: number; targetItemName?: string }, _f: Filters) {
    await settle(null);
    const m = s.magnitudePct;
    const notes: string[] = ['Simulated from historical elasticity and margin structure.', 'Estimate only — not an actual result.'];
    let revenue = 0, demand = 0, margin = 0, wastage = 0, profit = 0;

    switch (s.action) {
      case 'price_increase':
        demand = -m * 0.55; revenue = m + demand; margin = m * 1.4; profit = margin; wastage = -demand * 0.3;
        notes.unshift(`Assumes elasticity −0.55 for ${s.targetItemName ?? 'target item'}.`);
        break;
      case 'price_decrease':
        demand = m * 0.6; revenue = -m + demand; margin = -m * 0.5; profit = margin; wastage = demand * 0.4;
        notes.unshift(`Assumes elasticity −0.6 demand pickup on ${s.targetItemName ?? 'target item'}.`);
        break;
      case 'discount_change':
        demand = m * 0.9; revenue = -m * 0.4 + demand * 0.7; margin = -m * 0.8; profit = margin; wastage = demand * 0.5;
        notes.unshift('Discount depth vs repeat-rate curve applied.');
        break;
      case 'promotion_frequency':
        demand = m * 0.5; revenue = m * 0.35; margin = -m * 0.25; profit = margin; wastage = m * 0.4;
        notes.unshift('Diminishing returns applied per additional campaign.');
        break;
      case 'remove_item':
        revenue = -Math.abs(m) * 0.4; demand = -Math.abs(m) * 0.3; margin = Math.abs(m) * 0.25; profit = margin; wastage = -Math.abs(m) * 0.6;
        notes.unshift('Cannibalisation offset estimated from basket affinities.');
        break;
      case 'prep_reduction':
        wastage = -Math.abs(m); profit = Math.abs(m) * 0.35; margin = Math.abs(m) * 0.3; revenue = 0; demand = 0;
        notes.unshift('Stockout risk increases if demand exceeds plan.');
        break;
      case 'demand_increase':
        demand = m; revenue = m * 0.9; margin = m * 0.5; profit = margin; wastage = m * 0.6;
        notes.unshift('Capacity ceiling applied from prepared-volume history.');
        break;
      case 'wastage_assumption':
        wastage = m; profit = -Math.abs(m) * 0.4; margin = -Math.abs(m) * 0.35; revenue = 0; demand = 0;
        notes.unshift('Wastage cost assumption adjusted.');
        break;
      default:
        notes.push('Unknown scenario — zero impact applied.');
    }

    return {
      revenue: round(revenue, 1),
      contributionMargin: round(margin, 1),
      demand: round(demand, 1),
      wastage: round(wastage, 1),
      profitability: round(profit, 1),
      notes,
      isEstimate: true as const,
    };
  }

  async getDataQualityReport(_f: Filters) {
    return settle(buildDataQuality());
  }

  async getSparkJobs() {
    return settle(buildSparkJobs());
  }

  async getAuditLog() {
    return settle(buildAuditLog());
  }

  async getReports(_f: Filters) {
    return settle(buildReportDescriptors());
  }

  async getReportRows(kind: Parameters<typeof buildReportRows>[0], _f: Filters) {
    return settle(buildReportRows(kind));
  }

  async getFilterOptions(): Promise<FilterOptions> {
    return settle({
      locations: LOCATIONS.map((l) => ({ id: l.id, name: l.name })),
      categories: [...CATEGORIES],
      menuItems: ITEMS.map((i) => ({ id: i.id, name: i.name })),
      segments: SEGMENTS.map((s) => ({ id: s.toLowerCase().replace(/[^a-z]+/g, '_'), name: s })),
      channels: [...CHANNELS],
      promotions: PROMOTIONS.map((p) => ({ id: p.id, name: p.name })),
      performanceClasses: [
        { id: 'profit_driver', name: 'Profit Driver' },
        { id: 'volume_driver', name: 'Volume Driver' },
        { id: 'hidden_opportunity', name: 'Hidden Opportunity' },
        { id: 'low_performer', name: 'Low Performer' },
      ],
    });
  }
}

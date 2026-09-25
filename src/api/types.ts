/**
 * DineIQ frontend data contracts.
 * Every shape here mirrors a requirement of the DineIQ Specification v1.0.
 * These interfaces are the seam between the UI and any data source
 * (mock adapter during development, external DineIQ backend later).
 */

/* ------------------------------------------------------------------ */
/* Common                                                              */
/* ------------------------------------------------------------------ */

export type Role = 'administrator' | 'manager' | 'regional_manager' | 'analyst';

export interface AuthUser {
  id: string;
  displayName: string;
  email: string;
  role: Role;
  locations?: string[];
}

export interface AuthSession {
  user: AuthUser;
  token?: string; // real token supplied by the backend later
  issuedAt: string;
}

/** Global filter state — Step 48 (search & filtering). */
export interface Filters {
  dateFrom?: string;
  dateTo?: string;
  location?: string; // Location ID
  category?: string; // menu category
  menuItem?: string; // Item ID
  segment?: string; // customer segment
  channel?: string; // ordering channel
  promotion?: string; // promotion ID
  performanceClass?: PerformanceClass | 'all';
  priceMin?: number;
  priceMax?: number;
  ratingMin?: number;
  ratingMax?: number;
  wastageMin?: number;
  wastageMax?: number;
  query?: string;
}

export const DEFAULT_FILTERS: Filters = { performanceClass: 'all' };

/** Pagination envelope used by all list endpoints. */
export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

export type PerformanceClass = 'profit_driver' | 'volume_driver' | 'hidden_opportunity' | 'low_performer';

export type Priority = 'low' | 'medium' | 'high' | 'critical';

export interface TrendPoint {
  date: string; // ISO date
  value: number;
  compare?: number; // previous period value (optional)
}

export interface KpiDelta {
  value: number;
  deltaPct?: number; // vs previous period
  direction?: 'up' | 'down' | 'flat';
  /** For KPIs where "down" is good (e.g. wastage) */
  invertGood?: boolean;
}

export interface NarrativeBlock {
  /** "What happened" */
  happened: string;
  /** "Why did it happen" */
  why: string;
  /** "What is likely to happen" / "What to do next" */
  next: string;
  severity?: Priority;
}

/* ------------------------------------------------------------------ */
/* Executive overview — Step 42                                    */
/* ------------------------------------------------------------------ */

export interface OverviewKpis {
  revenue: KpiDelta;
  profit: KpiDelta;
  orders: KpiDelta;
  averageOrderValue: KpiDelta;
  activeCustomers: KpiDelta;
  repeatCustomers: KpiDelta;
  wastageCost: KpiDelta;
  forecastDemand: KpiDelta;
  criticalRecommendations: number;
  openAnomalies: number;
  overallRating?: KpiDelta;
}

export interface DashboardOverview {
  kpis: OverviewKpis;
  revenueTrend: TrendPoint[];
  orderTrend: TrendPoint[];
  topAlerts: OverviewAlert[];
  narratives: NarrativeBlock[];
}

export interface OverviewAlert {
  id: string;
  kind: 'anomaly' | 'recommendation' | 'wastage' | 'forecast' | 'promotion' | 'model';
  title: string;
  detail: string;
  priority: Priority;
}

/* ------------------------------------------------------------------ */
/* Revenue / Orders / Performance — Steps 8, 19                   */
/* ------------------------------------------------------------------ */

export interface RevenueAnalytics {
  series: TrendPoint[];
  byCategory: { name: string; revenue: number; profit: number }[];
  totalRevenue: number;
  totalProfit: number;
}

export interface OrderAnalytics {
  series: TrendPoint[];
  totalOrders: number;
  cancelledRate: number;
  basketSizeAvg: number;
}

/** Peak-period analysis — Step 19. */
export interface PeakPeriodAnalytics {
  /** heatmap: dayOfWeek × hour → order count */
  heatmap: { day: number; hour: number; orders: number }[];
  peakHours: { hour: number; orders: number }[];
  peakDays: { day: number; orders: number }[];
  weekendRatio: number;
  monthly: { month: string; orders: number; revenue: number }[];
  seasonal: { season: string; index: number }[]; // index vs average = 1.0
  locationSpecificPeak: { location: string; peakHour: number }[];
  channelPeaks: { channel: string; peakHour: number; peakDay: number }[];
  narrative: NarrativeBlock;
}

/* ------------------------------------------------------------------ */
/* Menu intelligence — Steps 9–11, 32, 43                          */
/* ------------------------------------------------------------------ */

export interface MenuItemPerformance {
  id: string;
  name: string;
  category: string;
  quantitySold: number;
  revenue: number;
  cost: number;
  contributionMargin: number;
  profitPct: number;
  rating: number;
  ratingCount: number;
  repeatPurchaseRate: number;
  wastagePct: number;
  promotionDependency: number; // % of sales during promotions
  salesTrendPct: number; // period-over-period
  classification: PerformanceClass;
  /** Step 11 tricky cases */
  flags: string[];
}

export interface MenuClassification {
  items: MenuItemPerformance[];
  counts: Record<PerformanceClass, number>;
  narrative: NarrativeBlock;
}

export interface SlowMovingItem {
  id: string;
  name: string;
  category: string;
  compositeScore: number; // 0–100 (higher = more slow-moving)
  factors: { name: string; value: number; weight: number }[]; // the 7 core factors
}

/* ------------------------------------------------------------------ */
/* Customers — Steps 15, 16, 36, 44                                */
/* ------------------------------------------------------------------ */

export interface CustomerSegment {
  id: string;
  name: string;
  customers: number;
  sharePct: number;
  avgMonetary: number;
  avgFrequency: number;
  avgRecencyDays: number;
  revenueSharePct: number;
  strategy: string; // targeting hint
}

export interface RfmRow {
  customerId: string;
  recencyDays: number;
  frequency: number;
  monetary: number;
  rScore: number;
  fScore: number;
  mScore: number;
  segmentId: string;
}

export interface RfmDistribution {
  rows: RfmRow[];
  bins: { label: string; count: number }[]; // score distribution
  narrative: NarrativeBlock;
}

export interface ChurnRiskRow {
  customerId: string;
  segment: string;
  riskScore: number; // 0–100
  recencyTrend: string;
  frequencyChangePct: number;
  monetaryChangePct: number;
  categoryDiversityChangePct: number;
  visitsPerMonth: number;
}

export interface CustomerTrendPoint {
  date: string;
  active: number;
  new: number;
  repeat: number;
  churned: number;
}

export interface CustomerAnalytics {
  segments: CustomerSegment[];
  rfm: RfmDistribution;
  churnRisk: ChurnRiskRow[];
  trends: CustomerTrendPoint[];
  topCustomers: RfmRow[];
  promoSensitive: RfmRow[];
  narrative: NarrativeBlock;
}

/* ------------------------------------------------------------------ */
/* Market basket — Steps 17, 18                                    */
/* ------------------------------------------------------------------ */

export interface BasketRule {
  id: string;
  antecedent: string[];
  consequent: string[];
  support: number;
  confidence: number;
  lift: number;
}

export interface BundleSuggestion {
  id: string;
  name: string;
  items: string[];
  type: 'combo' | 'cross_sell' | 'upsell' | 'pairing';
  evidence: BasketRule;
  estLiftPct: number;
}

export interface MarketBasketAnalytics {
  rules: BasketRule[];
  bundles: BundleSuggestion[];
  network: { nodes: { id: string; label: string; weight: number }[]; links: { source: string; target: string; lift: number }[] };
  narrative: NarrativeBlock;
}

/* ------------------------------------------------------------------ */
/* Forecasting — Steps 20, 21, 22, 46                              */
/* ------------------------------------------------------------------ */

export interface ForecastPoint {
  date: string;
  actual?: number;
  predicted?: number;
  lower?: number;
  upper?: number;
}

export interface ForecastMetrics {
  mae: number;
  rmse: number;
  mape: number;
  r2?: number;
  baselineMape: number; // simple baseline for comparison (NFR 4)
  improvementPct: number;
}

export interface HighRiskPeriod {
  date: string;
  expectedDemand: number;
  capacityIndex: number; // demand / prepared capacity
  risk: Priority;
  reason: string;
}

export interface ForecastSeries {
  scope: 'item' | 'category' | 'location';
  scopeLabel: string;
  horizonDays: number;
  points: ForecastPoint[];
  metrics: ForecastMetrics;
  highRiskPeriods: HighRiskPeriod[];
  splitNote: string; // time-aware validation note (Step 21)
  narrative: NarrativeBlock;
}

/* ------------------------------------------------------------------ */
/* Inventory & wastage — Steps 23, 24, 45                          */
/* ------------------------------------------------------------------ */

export interface WastageSummary {
  totalKg: number;
  totalCost: number;
  wastagePctOfPrep: number;
  trend: TrendPoint[];
}

export interface WastageTopItem {
  id: string;
  name: string;
  kg: number;
  cost: number;
  pctOfPrep: number;
  trendPct: number;
}

export interface WastageRiskRow {
  id: string;
  name: string;
  scope: 'item' | 'period' | 'location';
  riskScore: number; // 0–100
  predictedKg: number;
  drivers: string[];
}

export interface WastageBreakdown {
  dimension: 'item' | 'category' | 'location' | 'day' | 'period' | 'demand' | 'inventory' | 'promotion' | 'prep';
  rows: { label: string; kg: number; cost: number }[];
}

export interface WastageAnalytics {
  summary: WastageSummary;
  topItems: WastageTopItem[];
  byLocation: { location: string; kg: number; cost: number; pctOfPrep: number }[];
  risk: WastageRiskRow[];
  breakdowns: WastageBreakdown[];
  narrative: NarrativeBlock;
}

export interface InventorySnapshot {
  id: string;
  item: string;
  onHand: number;
  unit: string;
  daysOfSupply: number;
  reorderPoint: number;
  status: 'ok' | 'low' | 'critical';
}

/* ------------------------------------------------------------------ */
/* Pricing & promotions — Steps 25–28                              */
/* ------------------------------------------------------------------ */

export interface PriceHistoryPoint {
  date: string;
  price: number;
}

export interface PriceSensitivityRow {
  id: string;
  name: string;
  price: number;
  prevPrice: number;
  elasticity: number; // % demand change per % price change
  sensitivity: 'high' | 'moderate' | 'low';
  demandChangeAfterPriceChangePct: number;
  marginPct: number;
  priceHistory: PriceHistoryPoint[];
}

export interface PricingAnalytics {
  priceDemandCorrelation: number;
  items: PriceSensitivityRow[];
  repricingCandidates: { id: string; name: string; suggestion: string; estImpactPct: number }[];
  narrative: NarrativeBlock;
}

export interface PromotionRow {
  id: string;
  name: string;
  type: string;
  start: string;
  end: string;
  orderVolumeLiftPct: number;
  revenueLiftPct: number;
  marginChangePct: number;
  newCustomers: number;
  repeatRatePct: number;
  aovChangePct: number;
  wastageChangePct: number;
  postPromoRetentionPct: number;
  effectiveness: 'effective' | 'mixed' | 'ineffective';
  traps: PromotionTrap[];
}

export interface PromotionTrap {
  id: string;
  kind: string; // Step 28 list
  detail: string;
}

export interface PromotionAnalytics {
  promotions: PromotionRow[];
  trapsDetected: { promotion: string; trap: PromotionTrap }[];
  narrative: NarrativeBlock;
}

/* ------------------------------------------------------------------ */
/* Ratings & anomalies — Steps 29–31                               */
/* ------------------------------------------------------------------ */

export type AnomalyKind =
  | 'sales_spike' | 'sales_drop' | 'high_order_value' | 'unusual_discount'
  | 'unexpected_demand' | 'duplicate_transaction'
  | 'rating_spike' | 'rating_drop' | 'identical_ratings' | 'rating_burst' | 'rating_purchase_mismatch';

export interface AnomalyRow {
  id: string;
  date: string;
  kind: AnomalyKind;
  entity: string; // item / location / order reference
  severity: Priority;
  observed: string;
  expected: string;
  deviationSigma: number;
  resolved: boolean;
}

export interface RatingAnalytics {
  averageRating: number;
  trend: TrendPoint[];
  byItem: { id: string; name: string; rating: number; count: number; trendPct: number }[];
  byLocation: { location: string; rating: number }[];
  vsProfitability: { name: string; rating: number; marginPct: number }[];
  anomalies: AnomalyRow[];
  narrative: NarrativeBlock;
}

export interface AnomalyAnalytics {
  sales: AnomalyRow[];
  ratings: AnomalyRow[];
  timeline: { date: string; count: number; severity: Priority }[];
  narrative: NarrativeBlock;
}

/* ------------------------------------------------------------------ */
/* Locations & channels — Steps 33, 34, 35                         */
/* ------------------------------------------------------------------ */

export interface LocationPerformance {
  id: string;
  name: string;
  city: string;
  revenue: number;
  profit: number;
  marginPct: number;
  aov: number;
  customers: number;
  repeatRatePct: number;
  wastagePct: number;
  rating: number;
  promoEffectivenessPct: number;
  menuMix: Record<PerformanceClass, number>;
}

export interface ChannelPerformance {
  channel: string;
  orders: number;
  basketSize: number;
  aov: number;
  discountPct: number;
  marginPct: number;
  peakHour: number;
  topCategories: string[];
}

export interface LocationAnalytics {
  locations: LocationPerformance[];
  channels: ChannelPerformance[];
  /** Step 34 — same item, different class per location */
  locationMenuClasses: { item: string; location: string; classification: PerformanceClass }[];
  narrative: NarrativeBlock;
}

/* ------------------------------------------------------------------ */
/* Recommendations — Steps 37, 38, 39                              */
/* ------------------------------------------------------------------ */

export interface Recommendation {
  id: string;
  action: string;
  reason: string[]; // mandatory evidence (Step 38)
  priority: Priority;
  category: 'menu' | 'inventory' | 'pricing' | 'promotion' | 'customer' | 'location' | 'operations';
  impactEstimate: string;
  relatedEntity?: string;
}

export interface RecommendationFeed {
  items: Recommendation[];
  byPriority: Record<Priority, number>;
  narrative: NarrativeBlock;
}

/* ------------------------------------------------------------------ */
/* Dual pipeline — Steps 12–14, 47                                 */
/* ------------------------------------------------------------------ */

export interface ModelCandidate {
  pipeline: 'spark' | 'python';
  algorithm: string;
  version: string;
  accuracy: number;
  f1?: number;
  mae?: number;
  rmse?: number;
  selected: boolean;
}

export interface DualPipelineRow {
  recordId: string;
  actual: string;
  sparkResult: string;
  pythonResult: string;
  match: boolean;
  numericDiff?: number;
  sparkConfidence?: number;
  pythonConfidence?: number;
  explanation?: string;
}

export interface DualPipelineSummary {
  agreementPct: number;
  disagreementCount: number;
  comparedRecords: number;
  candidates: ModelCandidate[];
  rows: DualPipelineRow[];
  narrative: NarrativeBlock;
}

/* ------------------------------------------------------------------ */
/* What-if — Steps 40, 41                                          */
/* ------------------------------------------------------------------ */

export type WhatIfAction =
  | 'price_increase' | 'price_decrease' | 'discount_change'
  | 'promotion_frequency' | 'remove_item' | 'prep_reduction'
  | 'demand_increase' | 'wastage_assumption';

export interface WhatIfScenario {
  action: WhatIfAction;
  targetItemId?: string;
  targetItemName?: string;
  /** percentage magnitude for the chosen action */
  magnitudePct: number;
}

export interface WhatIfImpact {
  revenue: number; // delta %
  contributionMargin: number; // delta %
  demand: number; // delta %
  wastage: number; // delta %
  profitability: number; // delta %
  notes: string[];
  isEstimate: true; // must be surfaced as an estimate (Step 41)
}

/* ------------------------------------------------------------------ */
/* Reports & export — Steps 49, 50                                 */
/* ------------------------------------------------------------------ */

export type ReportKind =
  | 'menu_performance' | 'profitability' | 'customer_segmentation' | 'market_basket'
  | 'demand_forecast' | 'wastage' | 'promotions' | 'pricing'
  | 'location_performance' | 'anomalies' | 'recommendations' | 'model_comparison';

export interface ReportDescriptor {
  kind: ReportKind;
  name: string;
  description: string;
  rows: number;
  formats: ('csv' | 'xlsx')[];
}

export interface ExportRequest {
  resource: string;
  format: 'csv' | 'xlsx';
  filters: Filters;
}

/* ------------------------------------------------------------------ */
/* Data quality & jobs — Steps 4, 5, FR lxv                        */
/* ------------------------------------------------------------------ */

export interface DataQualityIssue {
  category: string; // e.g. "Missing values", "Duplicate orders"…
  count: number;
  severity: Priority;
  rule: string;
  action: string; // cleaning decision
}

export interface DataQualityReport {
  scannedRows: number;
  passRatePct: number;
  issues: DataQualityIssue[];
  cleaningDecisions: { rule: string; decision: string; recordsAffected: number }[];
  generatedAt: string;
}

export type JobStatus = 'queued' | 'running' | 'succeeded' | 'failed';

export interface SparkJob {
  id: string;
  name: string;
  stage: string;
  status: JobStatus;
  progressPct: number;
  startedAt: string;
  durationMs?: number;
  rowsProcessed?: number;
  logTail?: string;
}

/* ------------------------------------------------------------------ */
/* Ratings analytics (menu-level) — Step 29                        */
/* ------------------------------------------------------------------ */

export interface AuditEntry {
  id: string;
  at: string;
  actor: string;
  action: string;
  target: string;
}

/* ------------------------------------------------------------------ */
/* API service contract — every function maps to an module         */
/* ------------------------------------------------------------------ */

export interface DineIQDataSource {
  // auth
  login(email: string, password: string): Promise<AuthSession>;
  logout(): Promise<void>;
  getSession(): Promise<AuthSession | null>;

  // overview
  getDashboardOverview(f: Filters): Promise<DashboardOverview>;

  // analytics
  getRevenueAnalytics(f: Filters): Promise<RevenueAnalytics>;
  getOrderAnalytics(f: Filters): Promise<OrderAnalytics>;
  getPeakPeriodAnalytics(f: Filters): Promise<PeakPeriodAnalytics>;
  getForecastAnalytics(f: Filters, horizonDays: number, scope: 'item' | 'category' | 'location'): Promise<ForecastSeries>;
  getAnomalyAnalytics(f: Filters): Promise<AnomalyAnalytics>;
  getRatingAnalytics(f: Filters): Promise<RatingAnalytics>;
  getLocationAnalytics(f: Filters): Promise<LocationAnalytics>;

  // intelligence
  getMenuAnalytics(f: Filters): Promise<MenuClassification>;
  getSlowMovingItems(f: Filters): Promise<SlowMovingItem[]>;
  getCustomerAnalytics(f: Filters): Promise<CustomerAnalytics>;
  getMarketBasketAnalytics(f: Filters): Promise<MarketBasketAnalytics>;
  getPricingAnalytics(f: Filters): Promise<PricingAnalytics>;
  getPromotionAnalytics(f: Filters): Promise<PromotionAnalytics>;
  getRecommendations(f: Filters): Promise<RecommendationFeed>;
  getDualPipelineAnalytics(f: Filters): Promise<DualPipelineSummary>;

  // operations
  getWastageAnalytics(f: Filters): Promise<WastageAnalytics>;
  getInventorySnapshot(f: Filters): Promise<InventorySnapshot[]>;
  simulateScenario(s: WhatIfScenario, f: Filters): Promise<WhatIfImpact>;
  getDataQualityReport(f: Filters): Promise<DataQualityReport>;
  getSparkJobs(): Promise<SparkJob[]>;
  getAuditLog(): Promise<AuditEntry[]>;

  // reports
  getReports(f: Filters): Promise<ReportDescriptor[]>;
  getReportRows(kind: ReportKind, f: Filters): Promise<Record<string, unknown>[]>;

  // filter domains
  getFilterOptions(): Promise<FilterOptions>;
}

export interface FilterOptions {
  locations: { id: string; name: string }[];
  categories: string[];
  menuItems: { id: string; name: string }[];
  segments: { id: string; name: string }[];
  channels: string[];
  promotions: { id: string; name: string }[];
  performanceClasses: { id: PerformanceClass; name: string }[];
}

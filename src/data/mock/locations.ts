/**
 * DEVELOPMENT / DEMO DATA — locations, channels, peaks, revenue/orders
 * (Steps 8, 19, 33, 34, 35).
 */

import {
  ChannelPerformance, LocationAnalytics, LocationPerformance, OrderAnalytics,
  PeakPeriodAnalytics, PerformanceClass, RevenueAnalytics, TrendPoint,
} from '../../api/types';
import { between, lastNDays, round, rng } from './_util';
import { CATEGORIES, CHANNELS, LOCATIONS } from './catalog';

const CLASSES: PerformanceClass[] = ['profit_driver', 'volume_driver', 'hidden_opportunity', 'low_performer'];

export function buildLocations(): LocationPerformance[] {
  return LOCATIONS.map((l, i) => {
    const r = rng(600 + i * 41);
    const revenue = round(between(r, 1.4e6, 6.8e6));
    const marginPct = round(between(r, 16, 38), 1);
    const menuMix = {} as Record<PerformanceClass, number>;
    const raw = CLASSES.map(() => between(r, 6, 34));
    const sum = raw.reduce((a, b) => a + b, 0);
    CLASSES.forEach((c, k) => (menuMix[c] = round((raw[k] / sum) * 100, 1)));
    return {
      id: l.id,
      name: l.name,
      city: l.city,
      revenue,
      profit: round((revenue * marginPct) / 100),
      marginPct,
      aov: round(between(r, 2_400, 4_400)),
      customers: Math.round(between(r, 2_400, 11_500)),
      repeatRatePct: round(between(r, 34, 71), 1),
      wastagePct: round(between(r, 2.2, 9.4), 1),
      rating: round(between(r, 3.7, 4.9), 1),
      promoEffectivenessPct: round(between(r, 18, 82), 1),
      menuMix,
    };
  }).sort((a, b) => b.revenue - a.revenue);
}

export function buildChannels(): ChannelPerformance[] {
  return CHANNELS.map((ch, i) => {
    const r = rng(950 + i * 13);
    const orders = Math.round(between(r, 18_000, 96_000));
    return {
      channel: ch,
      orders,
      basketSize: round(between(r, 1.6, 4.4), 1),
      aov: round(between(r, 1_900, 4_900)),
      discountPct: round(between(r, 3, 24), 1),
      marginPct: round(between(r, 17, 36), 1),
      peakHour: Math.floor(between(r, 11, 22)),
      topCategories: ch === 'Third-Party Delivery'
        ? ['Burgers', 'Pizza', 'Mains']
        : ch === 'Dine-in'
          ? ['Grill', 'Starters', 'Seafood']
          : ch === 'Takeaway'
            ? ['Burgers', 'Sides', 'Beverages']
            : ['Pizza', 'Pasta', 'Desserts'],
    };
  });
}

export function buildLocationMenuClasses(): LocationAnalytics['locationMenuClasses'] {
  const out: LocationAnalytics['locationMenuClasses'] = [];
  const r = rng(1212);
  for (let i = 0; i < 96; i++) {
    out.push({
      item: ['Charcoal Ribeye', 'Smash Burger', 'Truffle Fries', 'Cold Brew Float', 'Seafood Linguine', 'Molten Lava Cake'][i % 6],
      location: LOCATIONS[i % LOCATIONS.length].name,
      classification: CLASSES[Math.floor(r() * CLASSES.length)],
    });
  }
  return out;
}

export function buildLocationsAnalytics(): LocationAnalytics {
  return {
    locations: buildLocations(),
    channels: buildChannels(),
    locationMenuClasses: buildLocationMenuClasses(),
    narrative: {
      happened: 'Top 5 locations contribute nearly half of revenue; channel mix is shifting toward third-party delivery.',
      why: 'Margin, repeat rate and wastage diverge sharply between flagship and satellite locations.',
      next: 'Replicate the menu mix of the highest-margin location across the bottom quartile; renegotiate delivery-channel discounts.',
      severity: 'medium',
    },
  };
}

export function buildPeaks(): PeakPeriodAnalytics {
  const r = rng(1919);
  const heatmap: PeakPeriodAnalytics['heatmap'] = [];
  for (let day = 0; day < 7; day++) {
    for (let hour = 6; hour < 24; hour++) {
      const lunch = hour >= 12 && hour <= 15 ? 2.1 : 1;
      const dinner = hour >= 19 && hour <= 22 ? 2.8 : 1;
      const weekend = day >= 5 ? 1.35 : 1;
      heatmap.push({ day, hour, orders: Math.round(120 * lunch * dinner * weekend * between(r, 0.8, 1.2)) });
    }
  }
  const peakHours = [...heatmap.reduce<Map<number, number>>((m, c) => m.set(c.hour, (m.get(c.hour) ?? 0) + c.orders), new Map())]
    .map(([hour, orders]) => ({ hour, orders }))
    .sort((a, b) => b.orders - a.orders)
    .slice(0, 6);
  const dayTotals = new Array(7).fill(0) as number[];
  heatmap.forEach((h) => (dayTotals[h.day] += h.orders));
  const peakDays = dayTotals.map((orders, day) => ({ day, orders })).sort((a, b) => b.orders - a.orders);

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];
  const monthly = monthNames.map((month) => ({
    month,
    orders: Math.round(between(r, 52_000, 88_000)),
    revenue: Math.round(between(r, 1.6e8, 2.7e8)),
  }));

  return {
    heatmap,
    peakHours,
    peakDays,
    weekendRatio: round(between(r, 38, 56), 1),
    monthly,
    seasonal: [
      { season: 'Winter', index: round(between(r, 0.92, 1.12), 2) },
      { season: 'Spring', index: round(between(r, 0.95, 1.1), 2) },
      { season: 'Summer', index: round(between(r, 0.88, 1.18), 2) },
      { season: 'Monsoon', index: round(between(r, 0.9, 1.24), 2) },
      { season: 'Festive', index: round(between(r, 1.05, 1.35), 2) },
    ],
    locationSpecificPeak: LOCATIONS.slice(0, 8).map((l) => ({ location: l.name, peakHour: Math.floor(between(r, 12, 21)) })),
    channelPeaks: CHANNELS.map((ch) => ({ channel: ch, peakHour: Math.floor(between(r, 11, 22)), peakDay: Math.floor(between(r, 0, 6)) })),
    narrative: {
      happened: 'Dinner (19–22h) is the dominant peak; weekends carry a disproportionate order share.',
      why: 'Holiday/festive months and delivery-channel peaks compound on Friday–Sunday evenings.',
      next: 'Align staffing and prep to the hour × day heat map; stagger promotion launches outside peak cannibalisation risk.',
      severity: 'medium',
    },
  };
}

export function buildRevenue(): RevenueAnalytics {
  const r = rng(31);
  const days = lastNDays(120);
  const series: TrendPoint[] = days.map((date, i) => {
    const wd = new Date(date).getUTCDay();
    const week = wd === 0 || wd === 6 ? 1.22 : 1;
    return { date, value: round((400_000 + i * 850) * week * between(r, 0.92, 1.08)) };
  });
  const byCategory = CATEGORIES.map((c) => {
    const rr = rng(c.length * 97);
    const revenue = round(between(rr, 1.2e6, 9.8e6));
    return { name: c, revenue, profit: round(revenue * between(rr, 0.16, 0.37)) };
  });
  return {
    series,
    byCategory,
    totalRevenue: round(series.reduce((s, t) => s + t.value, 0)),
    totalProfit: round(byCategory.reduce((s, c) => s + c.profit, 0)),
  };
}

export function buildOrders(): OrderAnalytics {
  const r = rng(73);
  const days = lastNDays(120);
  const series: TrendPoint[] = days.map((date, i) => {
    const wd = new Date(date).getUTCDay();
    const week = wd === 0 || wd === 6 ? 1.2 : 1;
    return { date, value: Math.round((1_420 + i * 5) * week * between(r, 0.9, 1.1)) };
  });
  return {
    series,
    totalOrders: series.reduce((s, t) => s + t.value, 0),
    cancelledRate: round(between(r, 1.4, 4.8), 1),
    basketSizeAvg: round(between(r, 2.1, 3.4), 1),
  };
}

/**
 * DEVELOPMENT / DEMO DATA HELPERS
 * --------------------------------
 * Deterministic generators so charts, tables, filters, sorting and
 * pagination can be exercised before the external DineIQ backend is
 * connected. Values are synthetic — never presented as verified results.
 */

export const ANCHOR_DATE = new Date('2026-09-25T00:00:00Z');

/** mulberry32 — tiny deterministic PRNG */
export function rng(seed: number) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function isoDay(offsetDays: number): string {
  const d = new Date(ANCHOR_DATE);
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

export function lastNDays(n: number, endOffset = 0): string[] {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) out.push(isoDay(endOffset - i));
  return out;
}

export function pick<T>(r: () => number, arr: T[]): T {
  return arr[Math.floor(r() * arr.length) % arr.length];
}

export function between(r: () => number, min: number, max: number): number {
  return min + r() * (max - min);
}

export function round(v: number, dp = 0): number {
  const f = Math.pow(10, dp);
  return Math.round(v * f) / f;
}

/**
 * Deterministic scaling factor for active global filters, so every surface
 * responds consistently when a filter changes (demo approximation).
 */
export function filterScale(seedKey: string, factor = 0.18): number {
  let h = hashStr(seedKey);
  h = (h * 1664525 + 1013904223) >>> 0;
  return 1 - ((h / 0xffffffff) % 1) * factor;
}

export function countDecimals(v: number): number {
  return String(v).split('.')[1]?.length ?? 0;
}

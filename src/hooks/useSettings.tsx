import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';

export type ThemePref = 'dark' | 'light' | 'system';
export type Density = 'comfortable' | 'compact';

interface Settings {
  themePref: ThemePref;
  resolvedTheme: 'dark' | 'light';
  /** 0 = minimal, 1 = standard, 2 = rich */
  animationLevel: 0 | 1 | 2;
  enable3D: boolean;
  density: Density;
  notifyAnomalies: boolean;
  notifyForecast: boolean;
  reduceMotion: boolean;
}

interface SettingsCtx extends Settings {
  setThemePref: (p: ThemePref) => void;
  setAnimationLevel: (l: 0 | 1 | 2) => void;
  setEnable3D: (v: boolean) => void;
  setDensity: (d: Density) => void;
  setNotifyAnomalies: (v: boolean) => void;
  setNotifyForecast: (v: boolean) => void;
}

const Ctx = createContext<SettingsCtx | null>(null);

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
}

function systemTheme(): 'dark' | 'light' {
  return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function systemReducedMotion(): boolean {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [themePref, setThemePrefState] = useState<ThemePref>(() => read<ThemePref>('dineiq.theme', 'dark'));
  const [animationLevel, setAnimationLevelState] = useState<0 | 1 | 2>(() => read('dineiq.anim', 1 as 0 | 1 | 2));
  const [enable3D, setEnable3DState] = useState<boolean>(() => read('dineiq.3d', true));
  const [density, setDensityState] = useState<Density>(() => read<Density>('dineiq.density', 'comfortable'));
  const [notifyAnomalies, setNotifyAnomaliesState] = useState<boolean>(() => read('dineiq.notify.anomaly', true));
  const [notifyForecast, setNotifyForecastState] = useState<boolean>(() => read('dineiq.notify.forecast', true));
  const [reduceMotionSys, setReduceMotionSys] = useState(systemReducedMotion);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const fn = () => setReduceMotionSys(mq.matches);
    mq.addEventListener?.('change', fn);
    return () => mq.removeEventListener?.('change', fn);
  }, []);

  const resolvedTheme: 'dark' | 'light' = themePref === 'system' ? systemTheme() : themePref;

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', resolvedTheme);
    document.documentElement.setAttribute('data-density', density);
  }, [resolvedTheme, density]);

  const setThemePref = useCallback((p: ThemePref) => { setThemePrefState(p); write('dineiq.theme', p); }, []);
  const setAnimationLevel = useCallback((l: 0 | 1 | 2) => { setAnimationLevelState(l); write('dineiq.anim', l); }, []);
  const setEnable3D = useCallback((v: boolean) => { setEnable3DState(v); write('dineiq.3d', v); }, []);
  const setDensity = useCallback((d: Density) => { setDensityState(d); write('dineiq.density', d); }, []);
  const setNotifyAnomalies = useCallback((v: boolean) => { setNotifyAnomaliesState(v); write('dineiq.notify.anomaly', v); }, []);
  const setNotifyForecast = useCallback((v: boolean) => { setNotifyForecastState(v); write('dineiq.notify.forecast', v); }, []);

  const value = useMemo<SettingsCtx>(() => ({
    themePref, resolvedTheme, animationLevel, enable3D, density,
    notifyAnomalies, notifyForecast, reduceMotion: reduceMotionSys,
    setThemePref, setAnimationLevel, setEnable3D, setDensity,
    setNotifyAnomalies, setNotifyForecast,
  }), [themePref, resolvedTheme, animationLevel, enable3D, density, notifyAnomalies, notifyForecast,
    reduceMotionSys, setThemePref, setAnimationLevel, setEnable3D, setDensity, setNotifyAnomalies, setNotifyForecast]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSettings(): SettingsCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useSettings must be used inside SettingsProvider');
  return ctx;
}

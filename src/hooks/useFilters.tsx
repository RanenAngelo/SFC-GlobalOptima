import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { DineIQApi } from '../api/DineIQApi';
import { DEFAULT_FILTERS, FilterOptions, Filters } from '../api/types';
import { useAuth } from './useAuth';

interface FiltersCtx {
  filters: Filters;
  options: FilterOptions | null;
  setFilter: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
  setFilters: (patch: Partial<Filters>) => void;
  reset: () => void;
  activeCount: number;
}

const Ctx = createContext<FiltersCtx | null>(null);

export function FiltersProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const [filters, setFiltersState] = useState<Filters>(DEFAULT_FILTERS);
  const [options, setOptions] = useState<FilterOptions | null>(null);

  useEffect(() => {
    if (!session) {
      setOptions(null);
      return;
    }
    let alive = true;
    DineIQApi.getFilterOptions()
      .then((o) => {
        if (!alive) return;
        const allowed = session?.user.locations ?? [];
        const visible = session && ['manager', 'regional_manager'].includes(session.user.role)
          ? o.locations.filter((x) => allowed.includes(x.id)) : o.locations;
        setOptions({ ...o, locations: visible });
        if (session && session.user.role === 'manager' && allowed.length === 1) {
          setFiltersState((current) => ({ ...current, location: allowed[0] }));
        }
      })
      .catch(() => { /* options are non-critical */ });
    return () => { alive = false; };
  }, [session?.user.id, session?.user.role]);

  const setFilter = useCallback(<K extends keyof Filters>(key: K, value: Filters[K]) => {
    if (key === 'location' && session && ['manager', 'regional_manager'].includes(session.user.role) && value && !session.user.locations?.includes(value as string)) return;
    setFiltersState((f) => ({ ...f, [key]: value }));
  }, [session]);

  const setFilters = useCallback((patch: Partial<Filters>) => {
    if (patch.location && session && ['manager', 'regional_manager'].includes(session.user.role) && !session.user.locations?.includes(patch.location)) return;
    setFiltersState((f) => ({ ...f, ...patch }));
  }, [session]);

  const reset = useCallback(() => setFiltersState({ ...DEFAULT_FILTERS, ...(session?.user.role === 'manager' && session.user.locations?.length === 1 ? { location: session.user.locations[0] } : {}) }), [session]);

  const activeCount = useMemo(() => {
    return Object.entries(filters).filter(([k, v]) => k !== 'performanceClass' && v !== undefined && v !== '' && v !== 'all').length;
  }, [filters]);

  const value = useMemo(() => ({ filters, options, setFilter, setFilters, reset, activeCount }),
    [filters, options, setFilter, setFilters, reset, activeCount]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useFilters(): FiltersCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useFilters must be used inside FiltersProvider');
  return ctx;
}

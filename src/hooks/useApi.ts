import { useCallback, useEffect, useRef, useState } from 'react';
import { DineIQApi } from '../api/DineIQApi';
import { Filters } from '../api/types';
import { useFilters } from './useFilters';

export type ApiStatus = 'loading' | 'ready' | 'error';

export interface ApiState<T> {
  status: ApiStatus;
  data?: T;
  error?: string;
}

/**
 * Data hook — the only way UI components touch data.
 *
 *   component → useApi(loader) → DineIQApi (adapter) → mock | real backend
 *
 * Re-runs whenever global filters (or extra deps) change; always exposes
 * loading / error / retry so every surface can render proper states.
 */
export function useApi<T>(
  loader: (f: Filters) => Promise<T>,
  extraDeps: unknown[] = [],
): ApiState<T> & { reload: () => void } {
  const { filters } = useFilters();
  const [state, setState] = useState<ApiState<T>>({ status: 'loading' });
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  const filtersKey = JSON.stringify(filters);
  const extraKey = JSON.stringify(extraDeps);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });
    loaderRef.current(filters)
      .then((data) => { if (!cancelled) setState({ status: 'ready', data }); })
      .catch((err: unknown) => {
        if (!cancelled) {
          setState({ status: 'error', error: err instanceof Error ? err.message : 'Unable to load this analysis.' });
        }
      });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey, extraKey, nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  return { ...state, reload };
}

/** True when a payload has no rows to show (drives empty states). */
export function isEmpty(data: unknown): boolean {
  if (data === null || data === undefined) return true;
  if (Array.isArray(data)) return data.length === 0;
  if (typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    const arrayKeys = Object.keys(obj).filter((k) => Array.isArray(obj[k]));
    if (arrayKeys.length > 0) return arrayKeys.every((k) => (obj[k] as unknown[]).length === 0);
  }
  return false;
}

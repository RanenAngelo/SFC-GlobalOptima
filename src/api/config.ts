export type DataMode = 'mock' | 'api';

const env = import.meta.env;

export const API_CONFIG = {
  BASE_URL: (env.VITE_API_BASE_URL as string | undefined) ?? '',
  MODE: ((env.VITE_DATA_MODE as DataMode | undefined) ?? 'api') as DataMode,
  MOCK_LATENCY_MS: 150,
} as const;

export function isMockMode(): boolean {
  return API_CONFIG.MODE !== 'api';
}

/**
 * DineIQApi — the single data service surface used by the UI.
 *
 *   UI → hook/service → DineIQApi → (MockAdapter | RealApiAdapter) → backend
 *
 * Components NEVER see URLs or adapters — only typed service functions.
 */

import { API_CONFIG } from './config';
import type { DineIQDataSource } from './types';
import { MockAdapter } from '../data/mock/mockAdapter';
import { RealApiAdapter } from './adapters/RealApiAdapter';

function createSource(): DineIQDataSource {
  return API_CONFIG.MODE === 'api' ? new RealApiAdapter() : new MockAdapter();
}

export const DineIQApi: DineIQDataSource = createSource();

export { API_CONFIG, isMockMode } from './config';

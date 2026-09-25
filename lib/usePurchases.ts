'use client';

import { useSyncExternalStore } from 'react';
import {
  subscribePurchases,
  getPurchaseSnapshot,
  getPurchaseServerSnapshot,
  type PurchaseSnapshot,
} from './purchases';

export function usePurchases(): PurchaseSnapshot {
  return useSyncExternalStore(subscribePurchases, getPurchaseSnapshot, getPurchaseServerSnapshot);
}

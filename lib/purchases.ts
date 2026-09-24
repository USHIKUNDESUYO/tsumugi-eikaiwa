'use client';

import { Capacitor } from '@capacitor/core';
import type { PurchasesPackage } from '@revenuecat/purchases-capacitor';

/** RevenueCat 側で設定する entitlement の識別子 */
export const PREMIUM_ENTITLEMENT = 'premium';

/** オフラインでも課金済みユーザーをロックアウトしないためのキャッシュ */
const PREMIUM_CACHE_KEY = 'tsumugi-premium-cache';

const ANDROID_KEY = process.env.NEXT_PUBLIC_REVENUECAT_ANDROID_KEY ?? '';
const IOS_KEY = process.env.NEXT_PUBLIC_REVENUECAT_IOS_KEY ?? '';

export type PurchaseStatus = 'idle' | 'loading' | 'ready' | 'unavailable' | 'error';

/** 画面で使うぶんだけに絞ったパッケージ情報 */
export interface SimplePackage {
  identifier: string;
  productId: string;
  title: string;
  priceString: string;
  kind: 'lifetime' | 'monthly' | 'annual' | 'other';
}

export interface PurchaseSnapshot {
  status: PurchaseStatus;
  /** ネイティブかつ APIキー設定済みで、実際に購入できる状態か */
  available: boolean;
  isPremium: boolean;
  packages: SimplePackage[];
  /** 購入・復元の進行中フラグ */
  busy: boolean;
  error?: string;
}

/* ------------------------------------------------------------------ */
/*  外部ストア（useSyncExternalStore 用）                                */
/* ------------------------------------------------------------------ */

const serverSnapshot: PurchaseSnapshot = {
  status: 'idle',
  available: false,
  isPremium: false,
  packages: [],
  busy: false,
};

let snapshot: PurchaseSnapshot = serverSnapshot;
const listeners = new Set<() => void>();

function set(patch: Partial<PurchaseSnapshot>): void {
  snapshot = { ...snapshot, ...patch };
  for (const listener of listeners) listener();
}

export function subscribePurchases(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getPurchaseSnapshot(): PurchaseSnapshot {
  return snapshot;
}

export function getPurchaseServerSnapshot(): PurchaseSnapshot {
  return serverSnapshot;
}

/* ------------------------------------------------------------------ */
/*  ヘルパー                                                            */
/* ------------------------------------------------------------------ */

function readCachedPremium(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(PREMIUM_CACHE_KEY) === '1';
  } catch {
    return false;
  }
}

function writeCachedPremium(value: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PREMIUM_CACHE_KEY, value ? '1' : '0');
  } catch {
    /* プライベートモードなど。キャッシュできなくても購入判定自体は動く。 */
  }
}

function apiKeyForPlatform(): string {
  return Capacitor.getPlatform() === 'ios' ? IOS_KEY : ANDROID_KEY;
}

function toSimple(pkg: PurchasesPackage): SimplePackage {
  const id = pkg.identifier.toLowerCase();
  const kind: SimplePackage['kind'] = id.includes('lifetime')
    ? 'lifetime'
    : id.includes('annual') || id.includes('year')
      ? 'annual'
      : id.includes('month')
        ? 'monthly'
        : 'other';

  return {
    identifier: pkg.identifier,
    productId: pkg.product.identifier,
    title: pkg.product.title,
    priceString: pkg.product.priceString,
    kind,
  };
}

/** 実際のパッケージ本体は SDK の型のまま持っておく必要がある */
let rawPackages: PurchasesPackage[] = [];

async function loadPlugin() {
  const { Purchases } = await import('@revenuecat/purchases-capacitor');
  return Purchases;
}

function entitlementActive(customerInfo: { entitlements: { active: Record<string, unknown> } }): boolean {
  return Boolean(customerInfo.entitlements.active[PREMIUM_ENTITLEMENT]);
}

/* ------------------------------------------------------------------ */
/*  公開API                                                            */
/* ------------------------------------------------------------------ */

let initialized = false;

/** アプリ起動時に一度だけ呼ぶ */
export async function initPurchases(): Promise<void> {
  if (initialized) return;
  initialized = true;

  // Web ではストア課金は存在しない。無料機能だけで成立するようにしてある。
  if (!Capacitor.isNativePlatform()) {
    set({ status: 'unavailable', available: false, isPremium: false });
    return;
  }

  const apiKey = apiKeyForPlatform();
  if (!apiKey) {
    set({
      status: 'unavailable',
      available: false,
      isPremium: readCachedPremium(),
      error: 'RevenueCat の APIキーが設定されていません',
    });
    return;
  }

  set({ status: 'loading', isPremium: readCachedPremium() });

  try {
    const Purchases = await loadPlugin();
    await Purchases.configure({ apiKey });

    const [{ customerInfo }, offerings] = await Promise.all([
      Purchases.getCustomerInfo(),
      Purchases.getOfferings(),
    ]);

    rawPackages = offerings.current?.availablePackages ?? [];
    const premium = entitlementActive(customerInfo);
    writeCachedPremium(premium);

    set({
      status: 'ready',
      available: true,
      isPremium: premium,
      packages: rawPackages.map(toSimple),
      error: undefined,
    });
  } catch (error) {
    console.error('RevenueCat init failed:', error);
    // 通信できなくても、前回の購入状態でアプリは使えるようにしておく
    set({
      status: 'error',
      available: false,
      isPremium: readCachedPremium(),
      error: error instanceof Error ? error.message : '購入情報を取得できませんでした',
    });
  }
}

/** パッケージを購入する。成功すれば true。 */
export async function purchase(identifier: string): Promise<boolean> {
  const target = rawPackages.find((p) => p.identifier === identifier);
  if (!target) {
    set({ error: '購入できる商品が見つかりませんでした' });
    return false;
  }

  set({ busy: true, error: undefined });
  try {
    const Purchases = await loadPlugin();
    const { customerInfo } = await Purchases.purchasePackage({ aPackage: target });
    const premium = entitlementActive(customerInfo);
    writeCachedPremium(premium);
    set({ isPremium: premium, busy: false });
    return premium;
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    // ユーザーが自分で閉じた場合はエラー表示しない
    const cancelled = /cancel/i.test(message) || (error as { userCancelled?: boolean })?.userCancelled;
    set({ busy: false, error: cancelled ? undefined : message || '購入を完了できませんでした' });
    return false;
  }
}

/** 機種変更などのあとに購入を復元する */
export async function restore(): Promise<boolean> {
  set({ busy: true, error: undefined });
  try {
    const Purchases = await loadPlugin();
    const { customerInfo } = await Purchases.restorePurchases();
    const premium = entitlementActive(customerInfo);
    writeCachedPremium(premium);
    set({ isPremium: premium, busy: false });
    return premium;
  } catch (error) {
    set({
      busy: false,
      error: error instanceof Error ? error.message : '購入を復元できませんでした',
    });
    return false;
  }
}

export function clearPurchaseError(): void {
  if (snapshot.error) set({ error: undefined });
}

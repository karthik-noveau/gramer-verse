import type { StorageKey } from 'common/constants/storage-keys';

/* ============================================================
   storage.api.ts — the only module that touches Browser Storage.

   Every read is defensive. Absent, unparseable and wrong-shaped
   all resolve to the documented default, and no path throws:
   private browsing rejects `setItem`, a full quota rejects it,
   and an extension can block the whole API. None of those is a
   reason for the app to stop working — the reader loses a
   preference, not the lesson.
   ============================================================ */

export type StorageFailure = 'unavailable' | 'quota' | 'blocked';

/** Set when a write has failed, so the app can say so once rather than
 *  silently pretending the preference was saved. Engine 30 surfaces it. */
let lastFailure: StorageFailure | null = null;

export const lastStorageFailure = (): StorageFailure | null => lastFailure;

/* Reading `window.localStorage` at all can throw — Safari with cookies
   blocked does exactly that — so even getting the object is guarded. */
const store = (): Storage | null => {
  try {
    return window.localStorage;
  } catch {
    lastFailure = 'blocked';
    return null;
  }
};

/**
 * Read a value, falling back to `fallback` unless `isValid` accepts what was
 * stored. The guard is not optional: a value written by an older version of the
 * app is exactly as untrustworthy as a value typed in by hand.
 */
export function read<T>(key: StorageKey, fallback: T, isValid: (value: unknown) => value is T): T {
  const s = store();
  if (!s) return fallback;

  let raw: string | null;
  try {
    raw = s.getItem(key);
  } catch {
    lastFailure = 'blocked';
    return fallback;
  }
  if (raw === null) return fallback;

  try {
    const parsed: unknown = JSON.parse(raw);
    return isValid(parsed) ? parsed : fallback;
  } catch {
    /* Not JSON. An older build stored bare strings, and a half-written value
       is possible on a killed tab. Either way the default is correct. */
    return fallback;
  }
}

/**
 * Write a value. Returns whether it was stored, so a caller that cares can
 * say so — but nothing has to care, and nothing throws.
 *
 * A rejected write leaves whatever was there before untouched: the value is
 * serialised first, so a quota failure cannot land halfway.
 */
export function write(key: StorageKey, value: unknown): boolean {
  const s = store();
  if (!s) return false;

  let serialised: string;
  try {
    serialised = JSON.stringify(value);
  } catch {
    return false;
  }

  try {
    s.setItem(key, serialised);
    lastFailure = null;
    return true;
  } catch (error) {
    lastFailure = isQuotaError(error) ? 'quota' : 'unavailable';
    return false;
  }
}

export function remove(key: StorageKey): void {
  const s = store();
  if (!s) return;
  try {
    s.removeItem(key);
  } catch {
    lastFailure = 'blocked';
  }
}

/* Browsers disagree on the name and the code, and Safari's private mode throws
   a plain error with a message instead. All three shapes mean the same thing:
   there is no room. */
const isQuotaError = (error: unknown): boolean => {
  if (!(error instanceof Error)) return false;
  if (error.name === 'QuotaExceededError') return true;
  if (error.name === 'NS_ERROR_DOM_QUOTA_REACHED') return true;
  return /quota/i.test(error.message);
};

/* ---- guards for the values this app stores ------------------ */
export const isString = (value: unknown): value is string => typeof value === 'string';
export const isBoolean = (value: unknown): value is boolean => typeof value === 'boolean';

export const isOneOf =
  <T extends string>(...allowed: readonly T[]) =>
  (value: unknown): value is T =>
    typeof value === 'string' && (allowed as readonly string[]).includes(value);

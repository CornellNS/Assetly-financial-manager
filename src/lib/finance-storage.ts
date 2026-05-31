import { mockFinanceData } from "./finance-data.ts";
import type { FinanceData } from "./finance-data.ts";
import {
  cloneFinanceData,
  createFinanceStorageEnvelope,
  parseFinanceStorageJson,
} from "./finance-validation.ts";
import type { FinanceValidationResult } from "./finance-validation.ts";

export const defaultFinanceStorageKey = "ledger-room-finance-data";
export const financeStorageBackupKey = `${defaultFinanceStorageKey}:last-backup`;
export const financeStorageBackupCreatedAtKey = `${financeStorageBackupKey}:created-at`;
export const financeStorageRecoveryKey = `${defaultFinanceStorageKey}:recovery`;
export const financeStorageRecoveryCreatedAtKey = `${financeStorageRecoveryKey}:created-at`;

export type FinanceStorageLike = Pick<Storage, "getItem" | "removeItem" | "setItem">;

export type FinanceStorageResult = FinanceValidationResult & {
  storageAvailable: boolean;
};

export type FinanceStorageWriteResult = {
  error: Error | null;
  ok: boolean;
  storageAvailable: boolean;
};

export function getBrowserFinanceStorage(): FinanceStorageLike | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
}

export function readStoredFinanceData(
  key = defaultFinanceStorageKey,
  fallback: FinanceData = mockFinanceData,
  storage: FinanceStorageLike | null = getBrowserFinanceStorage(),
): FinanceStorageResult {
  if (!storage) {
    return {
      data: cloneFinanceData(fallback),
      issues: [],
      migrated: false,
      ok: true,
      storageAvailable: false,
    };
  }

  try {
    const stored = storage.getItem(key);
    if (!stored) {
      return {
        data: cloneFinanceData(fallback),
        issues: [],
        migrated: false,
        ok: true,
        storageAvailable: true,
      };
    }

    const result = parseFinanceStorageJson(stored, fallback);
    if (!result.ok) {
      preserveUnparseableFinanceData(stored, key, storage);
      removeStoredFinanceData(key, storage);
    }

    return {
      ...result,
      storageAvailable: true,
    };
  } catch (error) {
    try {
      const stored = storage.getItem(key);
      if (stored) {
        preserveUnparseableFinanceData(stored, key, storage);
      }
    } catch {
      // Preserve the original parse error as the user-facing storage issue.
    }

    return {
      data: cloneFinanceData(fallback),
      issues: [getErrorMessage(error)],
      migrated: false,
      ok: false,
      storageAvailable: true,
    };
  }
}

function preserveUnparseableFinanceData(
  value: string,
  key: string,
  storage: FinanceStorageLike,
) {
  const recoveryKey =
    key === defaultFinanceStorageKey ? financeStorageRecoveryKey : `${key}:recovery`;
  storage.setItem(recoveryKey, value);
  storage.setItem(`${recoveryKey}:created-at`, new Date().toISOString());
}

export function writeStoredFinanceData(
  data: FinanceData,
  key = defaultFinanceStorageKey,
  storage: FinanceStorageLike | null = getBrowserFinanceStorage(),
): FinanceStorageWriteResult {
  if (!storage) {
    return {
      error: null,
      ok: false,
      storageAvailable: false,
    };
  }

  try {
    const nextJson = JSON.stringify(createFinanceStorageEnvelope(data));
    const previousJson = storage.getItem(key);
    if (previousJson && previousJson !== nextJson) {
      const backupKey =
        key === defaultFinanceStorageKey ? financeStorageBackupKey : `${key}:last-backup`;
      storage.setItem(backupKey, previousJson);
      storage.setItem(`${backupKey}:created-at`, new Date().toISOString());
    }
    storage.setItem(key, nextJson);
    return {
      error: null,
      ok: true,
      storageAvailable: true,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error : new Error(getErrorMessage(error)),
      ok: false,
      storageAvailable: true,
    };
  }
}

export function removeStoredFinanceData(
  key = defaultFinanceStorageKey,
  storage: FinanceStorageLike | null = getBrowserFinanceStorage(),
): FinanceStorageWriteResult {
  if (!storage) {
    return {
      error: null,
      ok: false,
      storageAvailable: false,
    };
  }

  try {
    storage.removeItem(key);
    return {
      error: null,
      ok: true,
      storageAvailable: true,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error : new Error(getErrorMessage(error)),
      ok: false,
      storageAvailable: true,
    };
  }
}

export function resetStoredFinanceData(
  key = defaultFinanceStorageKey,
  storage: FinanceStorageLike | null = getBrowserFinanceStorage(),
) {
  return writeStoredFinanceData(mockFinanceData, key, storage);
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

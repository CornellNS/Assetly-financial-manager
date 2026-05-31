export const financeAgentAuditStorageKey = "ledger-room-ai-agent-audit";
export const financeAgentPanelStorageKey = "ledger-room-ai-agent-panel";
export const financeAgentAuditMaxEntries = 50;
export const financeAgentAuditRetentionDays = 90;
export const weeklyReportSnapshotStorageKey = "ledger-room-weekly-report:snapshot";
export const weeklyReportHistoryStorageKey = "ledger-room-weekly-report:history";
export const legacyWeeklyReportHistoryStorageKey = "ledger-room-weekly-reports";

const dismissedNoticeStorageKey = "ledger-room-dismissed-notices";
const maxDismissedNoticeIds = 40;
const weeklyReportCachePrefix = "ledger-room-weekly-report:";
const weekDatePattern = /\d{4}-\d{2}-\d{2}/;

export type LocalWorkspaceStorage = Pick<
  Storage,
  "getItem" | "key" | "length" | "removeItem" | "setItem"
>;

export type LocalStorageCleanupResult = {
  removedKeys: string[];
  trimmedAiAuditEntries: number;
  trimmedDismissedNoticeIds: number;
  trimmedWeeklyReports: number;
};

export function cleanupLocalWorkspaceStorage(
  storage: LocalWorkspaceStorage | null | undefined,
  now = new Date(),
): LocalStorageCleanupResult {
  const result: LocalStorageCleanupResult = {
    removedKeys: [],
    trimmedAiAuditEntries: 0,
    trimmedDismissedNoticeIds: 0,
    trimmedWeeklyReports: 0,
  };

  if (!storage) {
    return result;
  }

  cleanupAgentAudit(storage, now, result);
  cleanupWeeklyReportHistory(storage, now, result);
  cleanupWeeklyReportCacheKeys(storage, now, result);
  cleanupDismissedNoticeIds(storage, result);
  cleanupAgentPanelFrame(storage, result);

  return result;
}

function cleanupAgentAudit(
  storage: LocalWorkspaceStorage,
  now: Date,
  result: LocalStorageCleanupResult,
) {
  const raw = storage.getItem(financeAgentAuditStorageKey);
  if (!raw) {
    return;
  }

  const parsed = parseJson(raw);
  if (!Array.isArray(parsed)) {
    removeStorageKey(storage, financeAgentAuditStorageKey, result);
    return;
  }

  const cutoffTime = now.getTime() - financeAgentAuditRetentionDays * 86_400_000;
  const kept = parsed
    .filter((entry) => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
        return false;
      }

      const record = entry as Record<string, unknown>;
      const createdAt = typeof record.createdAt === "string" ? record.createdAt : "";
      const createdTime = Date.parse(createdAt);

      return !Number.isNaN(createdTime) && createdTime >= cutoffTime;
    })
    .slice(0, financeAgentAuditMaxEntries);

  result.trimmedAiAuditEntries += Math.max(parsed.length - kept.length, 0);
  writeOrRemoveArray(storage, financeAgentAuditStorageKey, kept, result);
}

function cleanupWeeklyReportHistory(
  storage: LocalWorkspaceStorage,
  now: Date,
  result: LocalStorageCleanupResult,
) {
  [weeklyReportHistoryStorageKey, legacyWeeklyReportHistoryStorageKey].forEach((key) => {
    const raw = storage.getItem(key);
    if (!raw) {
      return;
    }

    const parsed = parseJson(raw);
    if (!Array.isArray(parsed)) {
      removeStorageKey(storage, key, result);
      return;
    }

    const kept = parsed.filter((report) => isWeeklyReportFromCurrentMonth(report, now));
    result.trimmedWeeklyReports += Math.max(parsed.length - kept.length, 0);
    writeOrRemoveArray(storage, key, kept, result);
  });
}

function cleanupWeeklyReportCacheKeys(
  storage: LocalWorkspaceStorage,
  now: Date,
  result: LocalStorageCleanupResult,
) {
  getStorageKeys(storage)
    .filter((key) => key.startsWith(weeklyReportCachePrefix))
    .filter((key) => key !== weeklyReportSnapshotStorageKey)
    .filter((key) => key !== weeklyReportHistoryStorageKey)
    .forEach((key) => {
      if (key === legacyWeeklyReportHistoryStorageKey) {
        return;
      }

      const dateMatch = weekDatePattern.exec(key);
      if (!dateMatch || !isDateStringInCurrentMonth(dateMatch[0], now)) {
        removeStorageKey(storage, key, result);
        result.trimmedWeeklyReports += 1;
      }
    });
}

function cleanupDismissedNoticeIds(
  storage: LocalWorkspaceStorage,
  result: LocalStorageCleanupResult,
) {
  const raw = storage.getItem(dismissedNoticeStorageKey);
  if (!raw) {
    return;
  }

  const parsed = parseJson(raw);
  if (!Array.isArray(parsed)) {
    removeStorageKey(storage, dismissedNoticeStorageKey, result);
    return;
  }

  const kept = parsed
    .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    .slice(-maxDismissedNoticeIds);

  result.trimmedDismissedNoticeIds += Math.max(parsed.length - kept.length, 0);
  writeOrRemoveArray(storage, dismissedNoticeStorageKey, kept, result);
}

function cleanupAgentPanelFrame(
  storage: LocalWorkspaceStorage,
  result: LocalStorageCleanupResult,
) {
  const raw = storage.getItem(financeAgentPanelStorageKey);
  if (!raw) {
    return;
  }

  const parsed = parseJson(raw);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    removeStorageKey(storage, financeAgentPanelStorageKey, result);
    return;
  }

  const frame = parsed as Record<string, unknown>;
  const values = [frame.height, frame.left, frame.top, frame.width];
  if (!values.every((value) => typeof value === "number" && Number.isFinite(value))) {
    removeStorageKey(storage, financeAgentPanelStorageKey, result);
  }
}

function isWeeklyReportFromCurrentMonth(report: unknown, now: Date) {
  if (!report || typeof report !== "object" || Array.isArray(report)) {
    return false;
  }

  const record = report as Record<string, unknown>;
  const weekStartDate =
    typeof record.generatedAt === "string"
      ? record.generatedAt.slice(0, 10)
      : typeof record.weekStartDate === "string"
        ? record.weekStartDate
        : typeof record.startDate === "string"
          ? record.startDate
          : "";

  return isDateStringInCurrentMonth(weekStartDate, now);
}

function isDateStringInCurrentMonth(value: string, now: Date) {
  const date = parseDateString(value);

  return (
    Boolean(date) &&
    date?.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth()
  );
}

function parseDateString(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) {
    return null;
  }

  const [, year, month, day] = match;
  const parsed = new Date(Number(year), Number(month) - 1, Number(day));
  if (
    parsed.getFullYear() !== Number(year) ||
    parsed.getMonth() !== Number(month) - 1 ||
    parsed.getDate() !== Number(day)
  ) {
    return null;
  }

  return parsed;
}

function getStorageKeys(storage: LocalWorkspaceStorage) {
  return Array.from({ length: storage.length }, (_, index) => storage.key(index)).filter(
    (key): key is string => Boolean(key),
  );
}

function writeOrRemoveArray(
  storage: LocalWorkspaceStorage,
  key: string,
  value: unknown[],
  result: LocalStorageCleanupResult,
) {
  if (value.length === 0) {
    removeStorageKey(storage, key, result);
    return;
  }

  storage.setItem(key, JSON.stringify(value));
}

function removeStorageKey(
  storage: LocalWorkspaceStorage,
  key: string,
  result: LocalStorageCleanupResult,
) {
  storage.removeItem(key);
  if (!result.removedKeys.includes(key)) {
    result.removedKeys.push(key);
  }
}

function parseJson(value: string) {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

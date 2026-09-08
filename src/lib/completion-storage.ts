export const COMPLETION_STORAGE_KEY_DEMO = "huskypilot.completedTasks.demo.v1";
export const COMPLETION_STORAGE_KEY_IMPORTED = "huskypilot.completedTasks.imported.v1";
const COMPLETION_STORAGE_VERSION = 1;

export type CompletionSource = "demo" | "imported";

type StoredCompletionPayload = {
  version: number;
  completedIds: string[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function storageKeyFor(source: CompletionSource): string {
  return source === "demo"
    ? COMPLETION_STORAGE_KEY_DEMO
    : COMPLETION_STORAGE_KEY_IMPORTED;
}

export function parseStoredCompletionPayload(
  rawValue: string,
): StoredCompletionPayload | null {
  try {
    const parsed = JSON.parse(rawValue);
    if (!isRecord(parsed)) return null;
    if (parsed.version !== COMPLETION_STORAGE_VERSION) return null;
    if (
      !Array.isArray(parsed.completedIds) ||
      !parsed.completedIds.every((id) => typeof id === "string")
    ) {
      return null;
    }

    return {
      version: COMPLETION_STORAGE_VERSION,
      completedIds: parsed.completedIds,
    };
  } catch {
    return null;
  }
}

export function restoreCompletedTaskIds(
  storage: Storage,
  source: CompletionSource,
): Set<string> {
  const raw = storage.getItem(storageKeyFor(source));
  if (!raw) return new Set();

  const parsed = parseStoredCompletionPayload(raw);
  if (!parsed) {
    storage.removeItem(storageKeyFor(source));
    return new Set();
  }

  return new Set(parsed.completedIds);
}

export function saveCompletedTaskIds(
  storage: Storage,
  source: CompletionSource,
  completedIds: Set<string>,
) {
  const payload: StoredCompletionPayload = {
    version: COMPLETION_STORAGE_VERSION,
    completedIds: [...completedIds],
  };

  storage.setItem(storageKeyFor(source), JSON.stringify(payload));
}

export function clearCompletedTaskIds(storage: Storage, source: CompletionSource) {
  storage.removeItem(storageKeyFor(source));
}

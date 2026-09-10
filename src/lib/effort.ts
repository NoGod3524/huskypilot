export const EFFORT_STORAGE_KEY = "huskypilot.effort.v1";
const EFFORT_STORAGE_VERSION = 1;

/** How much work a task is expected to take. */
export type EffortLevel = "quick" | "medium" | "long";

/** Task id -> effort level. Tasks without an entry use `DEFAULT_EFFORT`. */
export type EffortMap = Record<string, EffortLevel>;

export const EFFORT_LEVELS: readonly EffortLevel[] = ["quick", "medium", "long"];

export const EFFORT_MINUTES: Record<EffortLevel, number> = {
  quick: 15,
  medium: 45,
  long: 90,
};

export const DEFAULT_EFFORT: EffortLevel = "medium";

/** One sitting of focused work. Used to judge whether a deadline is reachable. */
export const SESSION_MINUTES = 30;

type StoredEffortPayload = {
  version: number;
  efforts: EffortMap;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function isEffortLevel(value: unknown): value is EffortLevel {
  return value === "quick" || value === "medium" || value === "long";
}

export function minutesFor(level: EffortLevel): number {
  return EFFORT_MINUTES[level];
}

/** The effort recorded for a task, or the default when it has none. */
export function effortFor(efforts: EffortMap, taskId: string): EffortLevel {
  return efforts[taskId] ?? DEFAULT_EFFORT;
}

/** A new map with one task's effort set. Never mutates the input. */
export function withEffort(
  efforts: EffortMap,
  taskId: string,
  level: EffortLevel,
): EffortMap {
  return { ...efforts, [taskId]: level };
}

export function parseStoredEffortMap(rawValue: string): EffortMap | null {
  try {
    const parsed = JSON.parse(rawValue);
    if (!isRecord(parsed)) return null;
    if (parsed.version !== EFFORT_STORAGE_VERSION) return null;
    if (!isRecord(parsed.efforts)) return null;

    const efforts: EffortMap = {};
    for (const [taskId, level] of Object.entries(parsed.efforts)) {
      // Drop anything unrecognised rather than trusting stored data.
      if (isEffortLevel(level)) efforts[taskId] = level;
    }

    return efforts;
  } catch {
    return null;
  }
}

export function restoreEffortMap(storage: Storage): EffortMap {
  const raw = storage.getItem(EFFORT_STORAGE_KEY);
  if (!raw) return {};

  const parsed = parseStoredEffortMap(raw);
  if (!parsed) {
    storage.removeItem(EFFORT_STORAGE_KEY);
    return {};
  }

  return parsed;
}

export function saveEffortMap(storage: Storage, efforts: EffortMap) {
  const payload: StoredEffortPayload = {
    version: EFFORT_STORAGE_VERSION,
    efforts,
  };

  storage.setItem(EFFORT_STORAGE_KEY, JSON.stringify(payload));
}

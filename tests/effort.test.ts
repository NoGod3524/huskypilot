import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_EFFORT,
  EFFORT_MINUTES,
  EFFORT_STORAGE_KEY,
  effortFor,
  isEffortLevel,
  minutesFor,
  parseStoredEffortMap,
  restoreEffortMap,
  saveEffortMap,
  withEffort,
} from "../src/lib/effort.ts";

class MemoryStorage implements Storage {
  private values = new Map<string, string>();

  get length() {
    return this.values.size;
  }

  clear() {
    this.values.clear();
  }

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  key(index: number) {
    return [...this.values.keys()][index] ?? null;
  }

  removeItem(key: string) {
    this.values.delete(key);
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

test("isEffortLevel accepts only the three levels", () => {
  assert.equal(isEffortLevel("quick"), true);
  assert.equal(isEffortLevel("medium"), true);
  assert.equal(isEffortLevel("long"), true);
  assert.equal(isEffortLevel("huge"), false);
  assert.equal(isEffortLevel(45), false);
  assert.equal(isEffortLevel(null), false);
});

test("minutesFor maps each level to its estimate", () => {
  assert.equal(minutesFor("quick"), EFFORT_MINUTES.quick);
  assert.equal(minutesFor("medium"), EFFORT_MINUTES.medium);
  assert.equal(minutesFor("long"), EFFORT_MINUTES.long);
});

test("effortFor falls back to the default for unknown tasks", () => {
  assert.equal(effortFor({}, "missing"), DEFAULT_EFFORT);
  assert.equal(effortFor({ "task-1": "long" }, "task-1"), "long");
  assert.equal(effortFor({ "task-1": "long" }, "task-2"), DEFAULT_EFFORT);
});

test("withEffort returns a new map and leaves the original alone", () => {
  const original = { "task-1": "quick" as const };
  const updated = withEffort(original, "task-2", "long");

  assert.deepEqual(updated, { "task-1": "quick", "task-2": "long" });
  assert.deepEqual(original, { "task-1": "quick" });
});

test("saveEffortMap round-trips through restoreEffortMap", () => {
  const storage = new MemoryStorage();
  const efforts = { "task-1": "quick" as const, "task-2": "long" as const };

  saveEffortMap(storage, efforts);

  assert.deepEqual(restoreEffortMap(storage), efforts);
});

test("restoreEffortMap returns an empty map when nothing is stored", () => {
  assert.deepEqual(restoreEffortMap(new MemoryStorage()), {});
});

test("restoreEffortMap clears corrupt data", () => {
  const storage = new MemoryStorage();
  storage.setItem(EFFORT_STORAGE_KEY, "{not-json");

  assert.deepEqual(restoreEffortMap(storage), {});
  assert.equal(storage.getItem(EFFORT_STORAGE_KEY), null);
});

test("parseStoredEffortMap drops unknown levels instead of trusting them", () => {
  const parsed = parseStoredEffortMap(
    JSON.stringify({
      version: 1,
      efforts: { good: "long", bad: "enormous", alsoBad: 7 },
    }),
  );

  assert.deepEqual(parsed, { good: "long" });
});

test("parseStoredEffortMap rejects other versions", () => {
  assert.equal(
    parseStoredEffortMap(JSON.stringify({ version: 2, efforts: { a: "long" } })),
    null,
  );
});

import assert from "node:assert/strict";
import test from "node:test";

import type { CalendarImportResult } from "../src/lib/calendar-types.ts";
import {
  IMPORT_STORAGE_KEY,
  parseStoredImportPayload,
  restoreImportedCalendar,
  saveImportedCalendar,
} from "../src/lib/import-storage.ts";

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

function sampleImport(): CalendarImportResult {
  return {
    calendarName: "HuskyCT",
    importedAt: "2026-09-08T00:00:00.000Z",
    events: [
      {
        id: "event-1",
        title: "Homework 1",
        course: "CSE 2050",
        start: "2026-09-10T14:00:00.000Z",
        dateKey: null,
        end: null,
        allDay: false,
        location: null,
      },
    ],
  };
}

test("saveImportedCalendar stores import payload without URL data", () => {
  const storage = new MemoryStorage();
  saveImportedCalendar(storage, sampleImport());

  const stored = storage.getItem(IMPORT_STORAGE_KEY);
  assert.ok(stored);
  const storedObject = JSON.parse(stored) as Record<string, unknown>;
  assert.equal("url" in storedObject, false);

  const parsed = parseStoredImportPayload(stored);
  assert.ok(parsed);
  assert.equal(parsed.calendarName, "HuskyCT");
  assert.equal(parsed.events.length, 1);
});

test("restoreImportedCalendar clears corrupt payload safely", () => {
  const storage = new MemoryStorage();
  storage.setItem(IMPORT_STORAGE_KEY, "{not-json");

  const restored = restoreImportedCalendar(storage);
  assert.equal(restored.calendar, null);
  assert.equal(restored.recoveredFromCorruptData, true);
  assert.equal(storage.getItem(IMPORT_STORAGE_KEY), null);
});

test("restoreImportedCalendar returns saved import when payload is valid", () => {
  const storage = new MemoryStorage();
  saveImportedCalendar(storage, sampleImport());

  const restored = restoreImportedCalendar(storage);
  assert.equal(restored.recoveredFromCorruptData, false);
  assert.ok(restored.calendar);
  assert.equal(restored.calendar?.events[0].title, "Homework 1");
});

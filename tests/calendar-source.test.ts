import assert from "node:assert/strict";
import test from "node:test";

import {
  CALENDAR_SOURCE_STORAGE_KEY,
  clearRememberedSource,
  isUsableSourceUrl,
  parseStoredSource,
  restoreRememberedSource,
  saveRememberedSource,
} from "../src/lib/calendar-source.ts";

const NOW = new Date(2026, 8, 8, 10, 0, 0);
const URL_OK = "https://lms.uconn.edu/webapps/calendar/calendarFeed/abc/learn.ics";

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

test("isUsableSourceUrl accepts an https feed URL", () => {
  assert.equal(isUsableSourceUrl(URL_OK), true);
  assert.equal(isUsableSourceUrl("  " + URL_OK + "  "), true);
});

test("isUsableSourceUrl rejects anything the importer would refuse", () => {
  assert.equal(isUsableSourceUrl("http://example.com/calendar.ics"), false);
  assert.equal(isUsableSourceUrl("https://user:pass@example.com/a.ics"), false);
  assert.equal(isUsableSourceUrl("not a url"), false);
  assert.equal(isUsableSourceUrl(""), false);
  assert.equal(isUsableSourceUrl("https://example.com/" + "a".repeat(2100)), false);
  assert.equal(isUsableSourceUrl(42), false);
  assert.equal(isUsableSourceUrl(null), false);
});

test("saveRememberedSource round-trips through restoreRememberedSource", () => {
  const storage = new MemoryStorage();

  assert.equal(saveRememberedSource(storage, URL_OK, NOW), true);

  assert.deepEqual(restoreRememberedSource(storage), {
    url: URL_OK,
    savedAt: NOW.toISOString(),
  });
});

test("saveRememberedSource refuses an unusable URL and stores nothing", () => {
  const storage = new MemoryStorage();

  assert.equal(saveRememberedSource(storage, "http://example.com/a.ics"), false);
  assert.equal(storage.getItem(CALENDAR_SOURCE_STORAGE_KEY), null);
});

test("restoreRememberedSource returns null when nothing is stored", () => {
  assert.equal(restoreRememberedSource(new MemoryStorage()), null);
});

test("restoreRememberedSource clears a corrupt record", () => {
  const storage = new MemoryStorage();
  storage.setItem(CALENDAR_SOURCE_STORAGE_KEY, "{not-json");

  assert.equal(restoreRememberedSource(storage), null);
  assert.equal(storage.getItem(CALENDAR_SOURCE_STORAGE_KEY), null);
});

test("parseStoredSource rejects other versions and non-https URLs", () => {
  assert.equal(
    parseStoredSource(
      JSON.stringify({ version: 99, url: URL_OK, savedAt: NOW.toISOString() }),
    ),
    null,
  );
  assert.equal(
    parseStoredSource(
      JSON.stringify({
        version: 1,
        url: "http://example.com/a.ics",
        savedAt: NOW.toISOString(),
      }),
    ),
    null,
  );
  assert.equal(
    parseStoredSource(JSON.stringify({ version: 1, url: URL_OK, savedAt: "nope" })),
    null,
  );
});

test("clearRememberedSource removes the record", () => {
  const storage = new MemoryStorage();
  saveRememberedSource(storage, URL_OK, NOW);

  clearRememberedSource(storage);

  assert.equal(storage.getItem(CALENDAR_SOURCE_STORAGE_KEY), null);
  assert.equal(restoreRememberedSource(storage), null);
});

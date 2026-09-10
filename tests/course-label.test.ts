import assert from "node:assert/strict";
import test from "node:test";

import {
  COURSE_LABEL_STORAGE_KEY,
  clearCourseLabel,
  isCourseComponent,
  normaliseCourseCode,
  parseStoredCourseLabel,
  restoreCourseLabel,
  saveCourseLabel,
} from "../src/lib/course-label.ts";

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

test("normaliseCourseCode trims, collapses spaces and caps the length", () => {
  assert.equal(normaliseCourseCode("  NRE   1000E "), "NRE 1000E");
  assert.equal(normaliseCourseCode("   "), "");
  assert.equal(normaliseCourseCode("A".repeat(40)).length, 24);
});

test("isCourseComponent accepts only the four components", () => {
  assert.equal(isCourseComponent("LEC"), true);
  assert.equal(isCourseComponent("DIS"), true);
  assert.equal(isCourseComponent("LAB"), true);
  assert.equal(isCourseComponent("SEM"), true);
  assert.equal(isCourseComponent("PRACTICUM"), false);
  assert.equal(isCourseComponent(null), false);
});

test("saveCourseLabel round-trips through restoreCourseLabel", () => {
  const storage = new MemoryStorage();

  saveCourseLabel(storage, { code: "  NRE 1000E ", component: "LEC" });

  assert.deepEqual(restoreCourseLabel(storage), {
    code: "NRE 1000E",
    component: "LEC",
  });
});

test("saveCourseLabel keeps a code with no component", () => {
  const storage = new MemoryStorage();

  saveCourseLabel(storage, { code: "STAT 1000Q", component: null });

  assert.deepEqual(restoreCourseLabel(storage), {
    code: "STAT 1000Q",
    component: null,
  });
});

test("saveCourseLabel keeps a space the user has just typed", () => {
  const storage = new MemoryStorage();

  // The label is saved on every keystroke, so trimming here would turn
  // "NRE 1000E" into "NRE1000E" the moment the space was pressed.
  const stored = saveCourseLabel(storage, { code: "NRE ", component: null });

  assert.equal(stored?.code, "NRE ");
  // Reading it back later trims it, which is fine once typing has stopped.
  assert.equal(restoreCourseLabel(storage)?.code, "NRE");
});

test("saveCourseLabel treats an empty code as clearing the label", () => {
  const storage = new MemoryStorage();
  saveCourseLabel(storage, { code: "NRE 1000E", component: "LEC" });

  assert.equal(saveCourseLabel(storage, { code: "   ", component: "LEC" }), null);
  assert.equal(storage.getItem(COURSE_LABEL_STORAGE_KEY), null);
  assert.equal(restoreCourseLabel(storage), null);
});

test("restoreCourseLabel returns null when nothing is stored", () => {
  assert.equal(restoreCourseLabel(new MemoryStorage()), null);
});

test("restoreCourseLabel clears corrupt data", () => {
  const storage = new MemoryStorage();
  storage.setItem(COURSE_LABEL_STORAGE_KEY, "{not-json");

  assert.equal(restoreCourseLabel(storage), null);
  assert.equal(storage.getItem(COURSE_LABEL_STORAGE_KEY), null);
});

test("parseStoredCourseLabel rejects other versions and bad components", () => {
  assert.equal(
    parseStoredCourseLabel(JSON.stringify({ version: 2, code: "NRE 1000E" })),
    null,
  );
  assert.equal(
    parseStoredCourseLabel(
      JSON.stringify({ version: 1, code: "NRE 1000E", component: "LECTURE" }),
    ),
    null,
  );
  assert.equal(
    parseStoredCourseLabel(JSON.stringify({ version: 1, code: "   " })),
    null,
  );
});

test("parseStoredCourseLabel tolerates a missing component", () => {
  assert.deepEqual(
    parseStoredCourseLabel(JSON.stringify({ version: 1, code: "NRE 1000E" })),
    { code: "NRE 1000E", component: null },
  );
});

test("clearCourseLabel removes the record", () => {
  const storage = new MemoryStorage();
  saveCourseLabel(storage, { code: "NRE 1000E", component: "LEC" });

  clearCourseLabel(storage);

  assert.equal(storage.getItem(COURSE_LABEL_STORAGE_KEY), null);
});

import assert from "node:assert/strict";
import test from "node:test";

import { blackboardKind } from "../src/lib/parse-calendar.ts";

// UIDs copied verbatim from a real Blackboard (HuskyCT) calendar export.
const CLASS_UID = "_blackboard.data.calendar.CalendarEntry-_1019004_1";
const ASSIGNMENT_UID = "_blackboard.platform.gradebook2.GradableItem-_3876640_1";

test("blackboardKind recognises a class meeting", () => {
  assert.equal(blackboardKind(CLASS_UID), "class");
});

test("blackboardKind recognises a graded item", () => {
  assert.equal(blackboardKind(ASSIGNMENT_UID), "assignment");
});

test("blackboardKind returns null for anything else", () => {
  assert.equal(blackboardKind("some-other-uid"), null);
  assert.equal(blackboardKind(""), null);
});

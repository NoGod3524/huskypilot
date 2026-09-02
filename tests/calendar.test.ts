import assert from "node:assert/strict";
import test from "node:test";

import { groupTasks } from "../src/lib/calendar-view.ts";
import { parseCalendar } from "../src/lib/parse-calendar.ts";
import { fetchCalendarText, SafeFetchError } from "../src/lib/safe-fetch.ts";

function addDays(value: Date, days: number, hour: number) {
  const copy = new Date(value.getFullYear(), value.getMonth(), value.getDate() + days, hour);
  return copy;
}

function icsDate(value: Date) {
  return value
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
}

test("parses, sorts and groups future VEVENT and VTODO items", async () => {
  const now = new Date(2026, 8, 1, 9, 0, 0);
  const calendar = `BEGIN:VCALENDAR
VERSION:2.0
X-WR-CALNAME:HuskyCT Test Calendar
BEGIN:VEVENT
UID:today
DTSTAMP:20260801T120000Z
DTSTART:${icsDate(addDays(now, 0, 14))}
SUMMARY:CSE 2050: Problem Set 1
END:VEVENT
BEGIN:VEVENT
UID:tomorrow
DTSTAMP:20260801T120000Z
DTSTART:${icsDate(addDays(now, 1, 11))}
SUMMARY:[ENGL 1007] Reading response
END:VEVENT
BEGIN:VEVENT
UID:week
DTSTAMP:20260801T120000Z
DTSTART:${icsDate(addDays(now, 3, 16))}
SUMMARY:Chapter quiz
CATEGORIES:ECON 1201
END:VEVENT
BEGIN:VEVENT
UID:cancelled
DTSTAMP:20260801T120000Z
DTSTART:${icsDate(addDays(now, 2, 12))}
SUMMARY:Cancelled task
STATUS:CANCELLED
END:VEVENT
BEGIN:VTODO
UID:todo
DTSTAMP:20260801T120000Z
DUE:${icsDate(addDays(now, 6, 18))}
SUMMARY:MATH 2110Q: Practice quiz
STATUS:NEEDS-ACTION
END:VTODO
BEGIN:VEVENT
UID:all-day
DTSTAMP:20260801T120000Z
DTSTART;VALUE=DATE:20260901
SUMMARY:All-day reminder
END:VEVENT
END:VCALENDAR`;

  const parsed = await parseCalendar(calendar, now);
  assert.equal(parsed.calendarName, "HuskyCT Test Calendar");
  assert.equal(parsed.events.some((event) => event.title === "Cancelled task"), false);
  assert.deepEqual(
    parsed.events.map((event) => event.start),
    [...parsed.events]
      .sort((left, right) => Date.parse(left.start) - Date.parse(right.start))
      .map((event) => event.start),
  );

  const allDay = parsed.events.find((event) => event.id.startsWith("all-day:"));
  assert.equal(allDay?.allDay, true);
  assert.equal(allDay?.dateKey, "2026-09-01");

  const groups = groupTasks(parsed.events, now);
  assert.deepEqual(
    groups.map((group) => group.tasks.length),
    [2, 1, 2],
  );
  assert.equal(groups[0].tasks.some((event) => event.course === "CSE 2050"), true);
  assert.equal(groups[1].tasks[0].course, "ENGL 1007");
  assert.equal(groups[2].tasks.some((event) => event.course === "ECON 1201"), true);
});

test("rejects non-HTTPS and private-network calendar targets", async () => {
  await assert.rejects(
    () => fetchCalendarText("http://example.com/calendar.ics"),
    (error) => error instanceof SafeFetchError && /HTTPS/.test(error.message),
  );
  await assert.rejects(
    () => fetchCalendarText("https://127.0.0.1/calendar.ics"),
    (error) => error instanceof SafeFetchError && /not allowed/.test(error.message),
  );
});

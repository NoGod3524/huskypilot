import assert from "node:assert/strict";
import test from "node:test";

import {
  CalendarFileError,
  MAX_CALENDAR_FILE_BYTES,
  calendarFileLabel,
  readCalendarFile,
} from "../src/lib/calendar-file.ts";
import { parseCalendar } from "../src/lib/parse-calendar.ts";

const NOW = new Date("2026-09-10T12:00:00.000Z");

const ICS = [
  "BEGIN:VCALENDAR",
  "VERSION:2.0",
  "PRODID:-//Blackboard//EN",
  "X-WR-CALNAME:University of Connecticut",
  "BEGIN:VEVENT",
  "DTSTAMP:20260910T120000Z",
  "DTSTART:20260912T123000Z",
  "DTEND:20260912T134500Z",
  "SUMMARY:Environmental Science",
  "UID:_blackboard.data.calendar.CalendarEntry-_1019004_1",
  "LOCATION:ARJ 105",
  "END:VEVENT",
  "END:VCALENDAR",
].join("\r\n");

function fileOf(content: string, name: string): File {
  return new File([content], name, { type: "text/calendar" });
}

test("calendarFileLabel drops the folder and the extension", () => {
  assert.equal(calendarFileLabel("learn.ics"), "learn");
  assert.equal(calendarFileLabel("NRE 1000E.ics"), "NRE 1000E");
  assert.equal(calendarFileLabel("STAT-1000Q.ICAL"), "STAT-1000Q");
  assert.equal(calendarFileLabel("C:\\Users\\me\\Downloads\\soci 1501.ifb"), "soci 1501");
  assert.equal(calendarFileLabel("/tmp/course.calendar.ics"), "course.calendar");
});

test("calendarFileLabel never returns an empty name", () => {
  // Stripping the extension would leave nothing, so the raw name stays.
  assert.equal(calendarFileLabel(".ics"), ".ics");
});

test("readCalendarFile names the calendar after the file, not the feed", async () => {
  const { name, icsText } = await readCalendarFile(fileOf(ICS, "NRE 1000E.ics"));

  // Every Blackboard export from one school says the same X-WR-CALNAME, so the
  // file name is the only thing that can tell five courses apart.
  assert.equal(name, "NRE 1000E");
  assert.match(icsText, /BEGIN:VCALENDAR/);
});

test("the text a file yields still parses into tasks", async () => {
  const { icsText } = await readCalendarFile(fileOf(ICS, "NRE 1000E.ics"));

  const result = await parseCalendar(icsText, NOW);

  assert.equal(result.calendarName, "University of Connecticut");
  assert.equal(result.events.length, 1);
  assert.equal(result.events[0].title, "Environmental Science");
  assert.equal(result.events[0].location, "ARJ 105");
  assert.equal(result.events[0].kind, "class");
});

test("readCalendarFile rejects a file that is not a calendar", async () => {
  await assert.rejects(
    () => readCalendarFile(fileOf("hello, this is a text file", "notes.txt")),
    (error: unknown) =>
      error instanceof CalendarFileError && error.problem === "not-a-calendar",
  );
});

test("readCalendarFile rejects an oversized file before reading it", async () => {
  const huge = fileOf("x".repeat(MAX_CALENDAR_FILE_BYTES + 1), "huge.ics");

  await assert.rejects(
    () => readCalendarFile(huge),
    (error: unknown) =>
      error instanceof CalendarFileError && error.problem === "too-large",
  );
});

test("an empty calendar parses to no events rather than failing", async () => {
  const empty = ["BEGIN:VCALENDAR", "VERSION:2.0", "END:VCALENDAR"].join("\r\n");

  const { icsText } = await readCalendarFile(fileOf(empty, "empty.ics"));
  const result = await parseCalendar(icsText, NOW);

  assert.deepEqual(result.events, []);
  assert.equal(result.calendarName, null);
});

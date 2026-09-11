/**
 * Reading a downloaded calendar file.
 *
 * The bytes never reach `node-ical` here: the parser's ESM entry imports
 * `node:fs` unconditionally (for its `parseFile` helper), which no browser
 * bundle can carry. So this module does the parts that must happen in the page —
 * size and sanity checks, and naming the calendar after the file — and the
 * parsing itself goes to the app's own endpoint, exactly like a link import.
 */

/** Anything larger is not a semester of deadlines. */
export const MAX_CALENDAR_FILE_BYTES = 1024 * 1024;

/** Why a file could not be used. The caller owns the wording. */
export type CalendarFileProblem = "too-large" | "not-a-calendar";

export class CalendarFileError extends Error {
  readonly problem: CalendarFileProblem;

  constructor(problem: CalendarFileProblem) {
    super(problem);
    this.name = "CalendarFileError";
    this.problem = problem;
  }
}

/**
 * What to call a dropped file on screen.
 *
 * Falls back to the raw name when stripping the extension would leave nothing,
 * so a file literally called `.ics` still shows up as something.
 */
export function calendarFileLabel(fileName: string): string {
  const base = fileName.split(/[\\/]/).pop() ?? fileName;
  const withoutExtension = base.replace(/\.(ics|ical|ifb)$/i, "").trim();
  return withoutExtension || base.trim();
}

export async function readCalendarFile(
  file: File,
): Promise<{ name: string; icsText: string }> {
  if (file.size > MAX_CALENDAR_FILE_BYTES) {
    throw new CalendarFileError("too-large");
  }

  const icsText = await file.text();
  if (!/BEGIN:VCALENDAR/i.test(icsText)) {
    throw new CalendarFileError("not-a-calendar");
  }

  return { name: calendarFileLabel(file.name), icsText };
}

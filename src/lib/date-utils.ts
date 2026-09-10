import type { CalendarTask } from "./calendar-types.ts";

/** Midnight at the start of the given date, in the viewer's local time zone. */
export function startOfLocalDay(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

/** A new date shifted by the given number of calendar days. */
export function addDays(value: Date, days: number): Date {
  const copy = new Date(value);
  copy.setDate(copy.getDate() + days);
  return copy;
}

/**
 * The day a task belongs to: the all-day `dateKey` when present, otherwise its
 * start timestamp. Keeping all-day events on their own date avoids the classic
 * "shows up on the previous day" UTC-midnight bug.
 */
export function taskDate(task: CalendarTask): Date {
  if (task.allDay && task.dateKey) {
    return new Date(`${task.dateKey}T00:00:00`);
  }
  return new Date(task.start);
}

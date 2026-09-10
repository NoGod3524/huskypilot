/**
 * What a Blackboard entry actually is, read from its UID. Blackboard puts class
 * meetings and graded items in the same calendar, and nothing else in the
 * payload tells them apart.
 */
export type TaskKind = "class" | "assignment";

export type CalendarTask = {
  id: string;
  title: string;
  course: string | null;
  start: string;
  dateKey: string | null;
  end: string | null;
  allDay: boolean;
  location: string | null;
  /** Absent on older saved payloads, and on feeds that are not Blackboard. */
  kind?: TaskKind | null;
};

export type CalendarImportResult = {
  calendarName: string | null;
  importedAt: string;
  events: CalendarTask[];
};

export type TaskGroup = {
  key: "today" | "tomorrow" | "week";
  title: string;
  dateLabel: string;
  accentClass: string;
  tasks: CalendarTask[];
};

export type CalendarTask = {
  id: string;
  title: string;
  course: string | null;
  start: string;
  dateKey: string | null;
  end: string | null;
  allDay: boolean;
  location: string | null;
};

export type CalendarImportResult = {
  calendarName: string | null;
  importedAt: string;
  events: CalendarTask[];
};

export type TaskGroup = {
  key: "today" | "tomorrow" | "week";
  title: "Today" | "Tomorrow" | "This Week";
  dateLabel: string;
  accentClass: string;
  tasks: CalendarTask[];
};

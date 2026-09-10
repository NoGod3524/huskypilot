"use client";

import {
  Bell,
  BellOff,
  BellRing,
  CalendarDays,
  ChartColumn,
  Check,
  ChevronRight,
  Clock3,
  LayoutDashboard,
  Link2,
  LoaderCircle,
  MapPin,
  RefreshCw,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";

import type {
  CalendarImportResult,
  CalendarTask,
  TaskGroup,
} from "@/lib/calendar-types";
import {
  clearImportedCalendar,
  restoreImportedCalendar,
  saveImportedCalendar,
} from "@/lib/import-storage";
import {
  clearCompletedTaskIds,
  restoreCompletedTaskIds,
  saveCompletedTaskIds,
  type CompletionSource,
} from "@/lib/completion-storage";
import {
  createDemoTasks,
  formatTaskTime,
  groupTasks,
  isDueSoon,
} from "@/lib/calendar-view";
import { addDays, startOfLocalDay } from "@/lib/date-utils";
import { computeInsights } from "@/lib/insights";
import {
  dueSoonTasks,
  reminderSignature,
  restoreReminderState,
  saveReminderState,
  shouldNotify,
  type ReminderState,
} from "@/lib/reminders";
import {
  DEFAULT_LOCALE,
  intlLocale,
  restoreLocale,
  saveLocale,
  t,
  type Locale,
} from "@/lib/i18n";

const courseStyles = [
  "bg-[#dbe8ff] text-[#1851a5]",
  "bg-[#e0f0e8] text-[#23724b]",
  "bg-[#f2e4fa] text-[#7c3e9d]",
  "bg-[#fff0d9] text-[#9b5a05]",
  "bg-[#ffe4e1] text-[#a34235]",
];

function styleForCourse(course: string) {
  const hash = Array.from(course).reduce(
    (total, character) => total + character.charCodeAt(0),
    0,
  );
  return courseStyles[hash % courseStyles.length];
}

function TaskCard({
  task,
  group,
  now,
  completed,
  onToggleComplete,
  locale,
}: {
  task: CalendarTask;
  group: TaskGroup["key"];
  now: Date;
  completed: boolean;
  onToggleComplete: (taskId: string) => void;
  locale: Locale;
}) {
  const course = task.course ?? "CALENDAR";
  const checkboxId = `task-complete-${task.id}`;

  return (
    <article className="group rounded-2xl border border-[var(--line)] bg-[#fcfdff] p-4 transition hover:-translate-y-0.5 hover:border-[#bfd3f0] hover:shadow-[0_8px_22px_rgba(37,74,119,0.08)]">
      <div className="flex items-start gap-3">
        <input
          id={checkboxId}
          type="checkbox"
          checked={completed}
          onChange={() => onToggleComplete(task.id)}
          aria-label={t(locale, completed ? "task.markIncomplete" : "task.markComplete", {
            title: task.title,
          })}
          className="mt-1 size-4 shrink-0 cursor-pointer accent-[#2a71d8]"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <span
              className={`max-w-[70%] truncate rounded-md px-2 py-1 text-[10px] font-bold tracking-[0.06em] ${styleForCourse(course)}`}
              title={course}
            >
              {course}
            </span>
            {isDueSoon(task, now) && (
              <span className="shrink-0 rounded-full bg-[#fff0ed] px-2 py-1 text-[10px] font-bold text-[#c5402d]">
                {t(locale, "badge.dueSoon")}
              </span>
            )}
          </div>
          <h4
            className={`mt-3 min-h-10 break-words text-sm font-semibold leading-5 ${completed ? "text-[var(--muted)] line-through" : "text-[#172b41]"}`}
          >
            <label htmlFor={checkboxId}>{task.title}</label>
          </h4>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-[var(--muted)]">
            <span className="flex items-center gap-1.5">
              <Clock3 size={13} />
              {formatTaskTime(task, group, locale)}
            </span>
            {task.location && (
              <span className="flex max-w-full items-center gap-1.5 truncate" title={task.location}>
                <MapPin size={13} className="shrink-0" />
                <span className="truncate">{task.location}</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

export function Dashboard({ initialNow }: { initialNow: string }) {
  const [now, setNow] = useState(() => new Date(initialNow));
  const [locale, setLocale] = useState<Locale>(DEFAULT_LOCALE);
  const [calendarUrl, setCalendarUrl] = useState("");
  const [tasks, setTasks] = useState(() => createDemoTasks(now));
  const [calendarName, setCalendarName] = useState<string | null>(null);
  const [importedAt, setImportedAt] = useState<string | null>(null);
  const [isImported, setIsImported] = useState(false);
  const [hasSavedImport, setHasSavedImport] = useState(false);
  const [restoredFromStorage, setRestoredFromStorage] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [completedIds, setCompletedIds] = useState<Set<string>>(() => new Set());
  const [remindersEnabled, setRemindersEnabled] = useState(false);
  // The "what did we already notify about" log is bookkeeping for an external
  // system (localStorage), not rendered state, so it lives in a ref.
  const reminderLog = useRef<{
    lastSignature: string | null;
    lastNotifiedAt: string | null;
  }>({ lastSignature: null, lastNotifiedAt: null });
  const [notificationPermission, setNotificationPermission] = useState<
    NotificationPermission | "unsupported"
  >("default");

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  function changeLocale(nextLocale: Locale) {
    setLocale(nextLocale);
    saveLocale(window.localStorage, nextLocale);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const currentTime = new Date();
      setNow(currentTime);
      const restoredLocale = restoreLocale(window.localStorage);
      setLocale(restoredLocale);

      const restored = restoreImportedCalendar(window.localStorage);
      if (restored.calendar) {
        setTasks(restored.calendar.events);
        setCalendarName(restored.calendar.calendarName);
        setImportedAt(restored.calendar.importedAt);
        setIsImported(true);
        setHasSavedImport(true);
        setRestoredFromStorage(true);
        setNotice(t(restoredLocale, "notices.restoredImported"));
        setCompletedIds(restoreCompletedTaskIds(window.localStorage, "imported"));
      } else {
        if (restored.recoveredFromCorruptData) {
          setNotice(t(restoredLocale, "notices.corruptDataCleared"));
        }
        setCompletedIds(restoreCompletedTaskIds(window.localStorage, "demo"));
      }

      const restoredReminders = restoreReminderState(window.localStorage);
      setRemindersEnabled(restoredReminders.enabled);
      reminderLog.current = {
        lastSignature: restoredReminders.lastSignature,
        lastNotifiedAt: restoredReminders.lastNotifiedAt,
      };
      setNotificationPermission(
        "Notification" in window ? Notification.permission : "unsupported",
      );
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const completionSource: CompletionSource = isImported ? "imported" : "demo";

  function toggleTaskCompletion(taskId: string) {
    setCompletedIds((previous) => {
      const next = new Set(previous);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      saveCompletedTaskIds(window.localStorage, completionSource, next);
      return next;
    });
  }

  const dueSoon = useMemo(() => dueSoonTasks(tasks, now), [tasks, now]);

  function setReminderEnabled(enabled: boolean) {
    setRemindersEnabled(enabled);
    saveReminderState(window.localStorage, { enabled, ...reminderLog.current });
  }

  async function toggleReminders() {
    if (remindersEnabled) {
      setReminderEnabled(false);
      return;
    }

    if (!("Notification" in window)) {
      setError(t(locale, "reminders.unsupported"));
      return;
    }

    let permission = Notification.permission;
    if (permission === "default") {
      permission = await Notification.requestPermission();
    }
    setNotificationPermission(permission);

    if (permission !== "granted") {
      setError(t(locale, "reminders.denied"));
      return;
    }

    setReminderEnabled(true);
    setError(null);
    setNotice(t(locale, "reminders.enabledNotice"));
  }

  // Nudge at most once per set of due tasks, and only while the app is open:
  // without a push server a web page cannot wake itself up in the background.
  useEffect(() => {
    if (!remindersEnabled || notificationPermission !== "granted") return;
    if (dueSoon.length === 0) return;

    const signature = reminderSignature(dueSoon);
    const current: ReminderState = { enabled: true, ...reminderLog.current };
    if (!shouldNotify(current, signature, new Date())) return;

    const title = t(locale, "reminders.notificationTitle");
    const options = {
      body: t(locale, "reminders.notificationBody", { count: dueSoon.length }),
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: "huskypilot-due",
    };

    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.ready
        .then((registration) => registration.showNotification(title, options))
        .catch(() => undefined);
    } else {
      new Notification(title, options);
    }

    reminderLog.current = {
      lastSignature: signature,
      lastNotifiedAt: new Date().toISOString(),
    };
    saveReminderState(window.localStorage, {
      enabled: true,
      ...reminderLog.current,
    });
  }, [remindersEnabled, notificationPermission, dueSoon, locale]);

  const groups = useMemo(() => groupTasks(tasks, now, locale), [tasks, now, locale]);
  const visibleCount = groups.reduce(
    (total, group) => total + group.tasks.length,
    0,
  );

  const insights = useMemo(
    () => computeInsights(tasks, completedIds, now),
    [tasks, completedIds, now],
  );
  const busiestDay = Math.max(1, ...insights.nextSevenDays);
  const busiestWeek = Math.max(1, ...insights.byWeek);
  const busiestCourse = Math.max(
    1,
    ...insights.byCourse.map((row) => row.total),
  );
  const completionPercent = Math.round(insights.completionRate * 100);

  const weekdayFormat = useMemo(
    () => new Intl.DateTimeFormat(intlLocale(locale), { weekday: "short" }),
    [locale],
  );

  function dayLabel(index: number) {
    if (index === 0) return t(locale, "group.today");
    if (index === 1) return t(locale, "group.tomorrow");
    return weekdayFormat.format(addDays(startOfLocalDay(now), index));
  }

  function barHeight(count: number, busiest: number) {
    if (count <= 0) return 0;
    // Keep any non-zero bar visible even when it is far below the maximum.
    return Math.max(8, Math.round((count / busiest) * 100));
  }

  const formattedToday = new Intl.DateTimeFormat(intlLocale(locale), {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(now);
  const formattedImportedAt = useMemo(() => {
    if (!importedAt) return null;
    return new Intl.DateTimeFormat(intlLocale(locale), {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(importedAt));
  }, [importedAt, locale]);

  async function handleImport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/calendar/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: calendarUrl }),
      });
      const result = (await response.json()) as CalendarImportResult & {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(result.error ?? t(locale, "errors.importFailed"));
      }

      setTasks(result.events);
      setCalendarName(result.calendarName);
      setImportedAt(result.importedAt);
      setIsImported(true);
      setHasSavedImport(true);
      setRestoredFromStorage(false);
      saveImportedCalendar(window.localStorage, result);
      const restoredCompleted = restoreCompletedTaskIds(window.localStorage, "imported");
      const eventIds = new Set(result.events.map((event) => event.id));
      setCompletedIds(
        new Set([...restoredCompleted].filter((id) => eventIds.has(id))),
      );
      setCalendarUrl("");
      setNotice(
        t(
          locale,
          result.events.length === 1 ? "notices.importedEvent" : "notices.importedEvents",
          { count: result.events.length },
        ),
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : t(locale, "errors.importFailed"),
      );
    } finally {
      setIsLoading(false);
    }
  }

  function restoreDemo() {
    setTasks(createDemoTasks(now));
    setIsImported(false);
    setRestoredFromStorage(false);
    setCompletedIds(restoreCompletedTaskIds(window.localStorage, "demo"));
    setNotice(
      hasSavedImport
        ? t(locale, "notices.demoRestoredWithSaved")
        : t(locale, "notices.demoRestored"),
    );
    setError(null);
  }

  function clearSavedData() {
    clearImportedCalendar(window.localStorage);
    clearCompletedTaskIds(window.localStorage, "imported");
    setHasSavedImport(false);
    setCalendarName(null);
    setImportedAt(null);
    setRestoredFromStorage(false);
    if (isImported) {
      setTasks(createDemoTasks(now));
      setIsImported(false);
      setCompletedIds(restoreCompletedTaskIds(window.localStorage, "demo"));
    }
    setNotice(t(locale, "notices.savedDataCleared"));
    setError(null);
  }

  function restoreSavedImport() {
    const restored = restoreImportedCalendar(window.localStorage);
    if (!restored.calendar) {
      setHasSavedImport(false);
      setNotice(null);
      setError(t(locale, "errors.noSavedImport"));
      return;
    }

    setTasks(restored.calendar.events);
    setCalendarName(restored.calendar.calendarName);
    setImportedAt(restored.calendar.importedAt);
    setIsImported(true);
    setHasSavedImport(true);
    setRestoredFromStorage(true);
    const restoredCompleted = restoreCompletedTaskIds(window.localStorage, "imported");
    const eventIds = new Set(restored.calendar.events.map((event) => event.id));
    setCompletedIds(
      new Set([...restoredCompleted].filter((id) => eventIds.has(id))),
    );
    setNotice(t(locale, "notices.savedImportRestored"));
    setError(null);
  }

  return (
    <main className="min-h-screen bg-[var(--canvas)] text-[var(--ink)]">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="hidden w-64 shrink-0 flex-col border-r border-[var(--line)] bg-white px-5 py-7 lg:flex">
          <div className="flex items-center gap-3 px-2">
            <div className="grid size-10 place-items-center rounded-xl bg-[var(--navy)] text-white shadow-[0_8px_24px_rgba(8,31,58,0.18)]">
              <Sparkles size={19} strokeWidth={2.2} />
            </div>
            <div>
              <p className="font-display text-lg font-semibold tracking-[-0.02em]">{t(locale, "app.name")}</p>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                {t(locale, "app.subtitle")}
              </p>
            </div>
          </div>

          <nav className="mt-12 space-y-2" aria-label="Main navigation">
            <a className="nav-item nav-item-active" href="#dashboard">
              <LayoutDashboard size={18} />{t(locale, "nav.dashboard")}
            </a>
            <a className="nav-item" href="#tasks">
              <Check size={18} />{t(locale, "nav.tasks")}
            </a>
            <a className="nav-item" href="#connect">
              <CalendarDays size={18} />{t(locale, "nav.calendar")}
            </a>
            <a className="nav-item" href="#insights">
              <ChartColumn size={18} />{t(locale, "insights.eyebrow")}
            </a>
          </nav>

          <div className="mt-auto rounded-2xl bg-[var(--navy)] p-4 text-white">
            <p className="text-sm font-semibold">
              {hasSavedImport ? calendarName ?? t(locale, "sidebar.calendarConnected") : t(locale, "sidebar.demoCalendar")}
            </p>
            <p className="mt-1 text-xs leading-5 text-blue-100/75">
              {hasSavedImport
                ? t(locale, "sidebar.importedDescription")
                : t(locale, "sidebar.connectDescription")}
            </p>
            {formattedImportedAt && (
              <p className="mt-2 text-[11px] text-blue-100/85">
                {t(locale, "sidebar.lastImported", { value: formattedImportedAt })}
              </p>
            )}
            {restoredFromStorage && (
              <p className="mt-1 text-[11px] text-blue-100/85">
                {t(locale, "sidebar.restoredFromStorage")}
              </p>
            )}
            <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-[#9ec5ff]">
              <span className="size-2 rounded-full bg-[#68d59b]" />
              {isImported
                ? t(locale, "sidebar.statusImported")
                : hasSavedImport
                  ? t(locale, "sidebar.statusSavedAvailable")
                  : t(locale, "sidebar.statusReady")}
            </div>
          </div>

        </aside>

        <section
          className="min-w-0 flex-1 px-4 py-5 sm:px-7 lg:px-10 lg:py-8"
          id="dashboard"
        >
          <header className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 lg:hidden">
              <div className="grid size-10 place-items-center rounded-xl bg-[var(--navy)] text-white">
                <Sparkles size={18} />
              </div>
              <span className="font-display text-lg font-semibold">{t(locale, "app.name")}</span>
            </div>
            <div className="ml-auto flex items-center gap-3">
              <div
                role="group"
                aria-label={t(locale, "language.label")}
                className="flex items-center gap-1 rounded-full border border-[var(--line)] bg-white p-1 text-xs font-semibold"
              >
                <button
                  type="button"
                  onClick={() => changeLocale("en")}
                  aria-pressed={locale === "en"}
                  aria-label={t(locale, "language.switchToEnglish")}
                  className={`rounded-full px-3 py-1.5 transition ${
                    locale === "en"
                      ? "bg-[var(--navy)] text-white"
                      : "text-[var(--muted)] hover:text-[#172b41]"
                  }`}
                >
                  {t(locale, "language.english")}
                </button>
                <button
                  type="button"
                  onClick={() => changeLocale("zh-CN")}
                  aria-pressed={locale === "zh-CN"}
                  aria-label={t(locale, "language.switchToChinese")}
                  className={`rounded-full px-3 py-1.5 transition ${
                    locale === "zh-CN"
                      ? "bg-[var(--navy)] text-white"
                      : "text-[var(--muted)] hover:text-[#172b41]"
                  }`}
                >
                  {t(locale, "language.chinese")}
                </button>
              </div>
              <button
                type="button"
                onClick={() => {
                  void toggleReminders();
                }}
                aria-pressed={remindersEnabled}
                aria-label={t(locale, "reminders.toggleLabel")}
                title={
                  remindersEnabled
                    ? t(locale, "reminders.on")
                    : t(locale, "reminders.off")
                }
                className={`grid size-9 shrink-0 place-items-center rounded-full border transition ${
                  remindersEnabled
                    ? "border-[var(--navy)] bg-[var(--navy)] text-white"
                    : "border-[var(--line)] bg-white text-[var(--muted)] hover:text-[#172b41]"
                }`}
              >
                {remindersEnabled ? <BellRing size={16} /> : <BellOff size={16} />}
              </button>
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold">{t(locale, "header.studentName")}</p>
                <p className="text-xs text-[var(--muted)]">{t(locale, "header.privateDashboard")}</p>
              </div>
              <div className="grid size-10 place-items-center rounded-full bg-[#dbe8ff] text-sm font-bold text-[#1851a5]">
                HS
              </div>
            </div>
          </header>

          <div className="mt-8 flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
            <div>
              <p className="eyebrow" suppressHydrationWarning>{formattedToday}</p>
              <h1 className="font-display mt-2 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
                {t(locale, "hero.title")}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)] sm:text-base">
                {t(locale, "hero.description")}
              </p>
            </div>
            <div className="flex items-center gap-2 self-start rounded-full border border-[var(--line)] bg-white px-4 py-2 text-xs font-semibold text-[var(--muted)] shadow-sm xl:self-auto">
              <Clock3 size={15} className="text-[#2a71d8]" />
              {t(locale, "hero.dueCount", { count: visibleCount })}
            </div>
          </div>

          <section
            className="mt-7 overflow-hidden rounded-[24px] border border-[#cdddf4] bg-white shadow-[0_16px_50px_rgba(29,69,116,0.08)]"
            aria-labelledby="connect-title"
            id="connect"
          >
            <div className="grid gap-6 p-5 sm:p-7 xl:grid-cols-[1fr_1.35fr] xl:items-center">
              <div className="flex gap-4">
                <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#e7f0ff] text-[#2368c8]">
                  <Link2 size={20} />
                </div>
                <div>
                  <h2 id="connect-title" className="font-display text-lg font-semibold">
                    {t(locale, "connect.title")}
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                    {t(locale, "connect.description")}
                  </p>
                </div>
              </div>
              <form className="flex flex-col gap-3 sm:flex-row" onSubmit={handleImport}>
                <label className="sr-only" htmlFor="calendar-url">
                  {t(locale, "connect.inputLabel")}
                </label>
                <input
                  id="calendar-url"
                  name="calendarUrl"
                  type="url"
                  inputMode="url"
                  autoComplete="off"
                  required
                  value={calendarUrl}
                  onChange={(event) => setCalendarUrl(event.target.value)}
                  placeholder={t(locale, "connect.placeholder")}
                  className="h-12 min-w-0 flex-1 rounded-xl border border-[var(--line-strong)] bg-[#fbfcfe] px-4 text-sm outline-none transition focus:border-[#2a71d8] focus:ring-4 focus:ring-[#2a71d8]/10"
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[var(--blue)] px-5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(35,104,200,0.24)] transition hover:bg-[#1857aa] focus:outline-none focus:ring-4 focus:ring-[#2a71d8]/20 disabled:cursor-wait disabled:opacity-70"
                >
                  {isLoading ? (
                    <><LoaderCircle size={17} className="animate-spin" />{t(locale, "connect.importing")}</>
                  ) : (
                    <>{t(locale, "connect.importButton")}<ChevronRight size={17} /></>
                  )}
                </button>
              </form>
            </div>

            <details className="group border-t border-[var(--line)] px-5 py-3 text-sm sm:px-7">
              <summary className="flex cursor-pointer list-none items-center gap-2 font-semibold text-[#31506f] [&::-webkit-details-marker]:hidden">
                <ChevronRight size={15} className="shrink-0 text-[#2a71d8] transition group-open:rotate-90" />
                {t(locale, "connect.helpTitle")}
              </summary>
              <ol className="mt-3 list-decimal space-y-1.5 pl-5 leading-6 text-[var(--muted)]">
                <li>{t(locale, "connect.helpStep1")}</li>
                <li>{t(locale, "connect.helpStep2")}</li>
                <li>{t(locale, "connect.helpStep3")}</li>
                <li>{t(locale, "connect.helpStep4")}</li>
              </ol>
              <p className="mt-3 text-xs leading-5 text-[var(--muted)]">
                {t(locale, "connect.helpNote")}
              </p>
            </details>

            {(error || notice) && (
              <div
                className={`flex items-start gap-2 border-t px-5 py-3 text-sm sm:px-7 ${error ? "border-[#f3cec8] bg-[#fff6f4] text-[#9f3527]" : "border-[#cce5d7] bg-[#f3fbf7] text-[#276944]"}`}
                role={error ? "alert" : "status"}
                aria-live="polite"
              >
                {error ? <TriangleAlert size={17} className="mt-0.5 shrink-0" /> : <Check size={17} className="mt-0.5 shrink-0" />}
                <span>{error ?? notice}</span>
              </div>
            )}

          </section>

          {dueSoon.length > 0 && (
            <div
              className="mt-6 flex items-start gap-2.5 rounded-2xl border border-[#f0d9a8] bg-[#fffaf0] px-4 py-3 text-sm text-[#8a5a12]"
              role="status"
            >
              <Bell size={17} className="mt-0.5 shrink-0" />
              <span>{t(locale, "reminders.banner", { count: dueSoon.length })}</span>
            </div>
          )}

          <div className="mt-8 flex items-end justify-between gap-4" id="tasks">
            <div>
              <p className="eyebrow">{t(locale, "deadlineRadar.eyebrow")}</p>
              <h2 className="font-display mt-1 text-2xl font-semibold tracking-[-0.025em]">
                {t(locale, "deadlineRadar.heading")}
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {isImported && (
                <button
                  type="button"
                  onClick={restoreDemo}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#cdd9e6] bg-white px-3 py-1.5 text-xs font-semibold text-[#4e647b] transition hover:border-[#9fb7d1] hover:text-[#244e7a]"
                >
                  <RefreshCw size={13} />{t(locale, "actions.useDemo")}
                </button>
              )}
              {hasSavedImport && !isImported && (
                <button
                  type="button"
                  onClick={restoreSavedImport}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#cdd9e6] bg-white px-3 py-1.5 text-xs font-semibold text-[#4e647b] transition hover:border-[#9fb7d1] hover:text-[#244e7a]"
                >
                  {t(locale, "actions.restoreSavedImport")}
                </button>
              )}
              {hasSavedImport && (
                <button
                  type="button"
                  onClick={clearSavedData}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#cdd9e6] bg-white px-3 py-1.5 text-xs font-semibold text-[#4e647b] transition hover:border-[#9fb7d1] hover:text-[#244e7a]"
                >
                  {t(locale, "actions.clearSavedData")}
                </button>
              )}
              {!hasSavedImport && (
                <span className="rounded-full bg-[#eaf2ff] px-3 py-1.5 text-xs font-semibold text-[#245ea9]">
                  {t(locale, "actions.demoPreview")}
                </span>
              )}
            </div>
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-3">
            {groups.map((group) => (
              <section
                key={group.key}
                className="rounded-[20px] border border-[var(--line)] bg-white p-4 shadow-[0_8px_30px_rgba(31,58,92,0.05)]"
              >
                <div className="flex items-center justify-between px-1 pb-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className={`size-2.5 shrink-0 rounded-full ${group.accentClass}`} />
                    <h3 className="font-display font-semibold">{group.title}</h3>
                    <span className="truncate text-xs text-[var(--muted)]">{group.dateLabel}</span>
                  </div>
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#f0f3f7] text-xs font-bold text-[#536476]">
                    {group.tasks.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {group.tasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      group={group.key}
                      now={now}
                      completed={completedIds.has(task.id)}
                      onToggleComplete={toggleTaskCompletion}
                      locale={locale}
                    />
                  ))}
                  {group.tasks.length === 0 && (
                    <div className="grid min-h-[132px] place-items-center rounded-2xl border border-dashed border-[#d7e1ec] bg-[#fafcff] p-5 text-center">
                      <div>
                        <Check size={18} className="mx-auto text-[#5ba97d]" />
                        <p className="mt-2 text-xs text-[var(--muted)]">
                          {t(locale, "empty.nothingDue")}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            ))}
          </div>

          <section className="mt-10" aria-labelledby="insights-heading" id="insights">
            <div>
              <p className="eyebrow">{t(locale, "insights.eyebrow")}</p>
              <h2
                id="insights-heading"
                className="font-display mt-1 text-2xl font-semibold tracking-[-0.025em]"
              >
                {t(locale, "insights.heading")}
              </h2>
            </div>

            {insights.total === 0 ? (
              <p className="mt-4 rounded-2xl border border-dashed border-[#d7e1ec] bg-[#fafcff] p-5 text-sm text-[var(--muted)]">
                {t(locale, "insights.empty")}
              </p>
            ) : (
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <article className="rounded-[20px] border border-[var(--line)] bg-white p-5 shadow-[0_8px_30px_rgba(31,58,92,0.05)]">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                    {t(locale, "insights.completion")}
                  </h3>
                  <p className="font-display mt-3 text-3xl font-semibold text-[#172b41]">
                    {completionPercent}%
                  </p>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {t(locale, "insights.completedOf", {
                      completed: insights.completed,
                      total: insights.total,
                    })}
                  </p>
                  <div
                    className="mt-4 h-2 overflow-hidden rounded-full bg-[#eef2f7]"
                    role="progressbar"
                    aria-label={t(locale, "insights.completion")}
                    aria-valuenow={completionPercent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div
                      className="h-full rounded-full bg-[#2f8f5b]"
                      style={{ width: `${completionPercent}%` }}
                    />
                  </div>
                </article>

                <article className="rounded-[20px] border border-[var(--line)] bg-white p-5 shadow-[0_8px_30px_rgba(31,58,92,0.05)]">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                    {t(locale, "insights.nextSevenDays")}
                  </h3>
                  <div className="mt-4 flex items-end gap-2">
                    {insights.nextSevenDays.map((count, index) => (
                      <div
                        key={index}
                        className="flex flex-1 flex-col items-center gap-1"
                      >
                        <span className="text-xs font-semibold text-[#31506f]">
                          {count}
                        </span>
                        <div className="flex h-24 w-full items-end rounded-md bg-[#f0f3f7]">
                          <div
                            className="w-full rounded-md bg-[#2a71d8]"
                            style={{ height: `${barHeight(count, busiestDay)}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-[var(--muted)]">
                          {dayLabel(index)}
                        </span>
                      </div>
                    ))}
                  </div>
                </article>

                <article className="rounded-[20px] border border-[var(--line)] bg-white p-5 shadow-[0_8px_30px_rgba(31,58,92,0.05)]">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                    {t(locale, "insights.byCourse")}
                  </h3>
                  <ul className="mt-4 space-y-3">
                    {insights.byCourse.map((row) => (
                      <li key={row.course ?? "__uncategorized"}>
                        <div className="flex items-center justify-between gap-3 text-xs">
                          <span className="truncate font-semibold text-[#31506f]">
                            {row.course ?? t(locale, "insights.uncategorized")}
                          </span>
                          <span className="shrink-0 text-[var(--muted)]">
                            {row.completed}/{row.total}
                          </span>
                        </div>
                        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#eef2f7]">
                          <div
                            className="h-full rounded-full bg-[#2a71d8]"
                            style={{
                              width: `${barHeight(row.total, busiestCourse)}%`,
                            }}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                </article>

                <article className="rounded-[20px] border border-[var(--line)] bg-white p-5 shadow-[0_8px_30px_rgba(31,58,92,0.05)]">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                    {t(locale, "insights.byWeek")}
                  </h3>
                  <div className="mt-4 flex items-end gap-3">
                    {insights.byWeek.map((count, index) => (
                      <div
                        key={index}
                        className="flex flex-1 flex-col items-center gap-1"
                      >
                        <span className="text-xs font-semibold text-[#31506f]">
                          {count}
                        </span>
                        <div className="flex h-24 w-full items-end rounded-md bg-[#f0f3f7]">
                          <div
                            className="w-full rounded-md bg-[#e9a23b]"
                            style={{ height: `${barHeight(count, busiestWeek)}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-[var(--muted)]">
                          {t(locale, "insights.week", { index: index + 1 })}
                        </span>
                      </div>
                    ))}
                  </div>
                </article>
              </div>
            )}
          </section>
        </section>
      </div>
    </main>
  );
}

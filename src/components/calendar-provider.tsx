"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";

import type { CalendarImportResult, CalendarTask, TaskGroup } from "@/lib/calendar-types";
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
import { createDemoTasks, groupTasks } from "@/lib/calendar-view";
import { computeInsights, type Insights } from "@/lib/insights";
import {
  dueSoonTasks,
  reminderSignature,
  restoreReminderState,
  saveReminderState,
  shouldNotify,
  type ReminderState,
} from "@/lib/reminders";
import { CSV_BOM, exportFileName, tasksToCsv } from "@/lib/export";
import {
  clearRememberedSource,
  isUsableSourceUrl,
  restoreRememberedSource,
  saveRememberedSource,
} from "@/lib/calendar-source";
import {
  DEFAULT_LOCALE,
  intlLocale,
  restoreLocale,
  saveLocale,
  t,
  type Locale,
} from "@/lib/i18n";

type CalendarContextValue = {
  now: Date;
  locale: Locale;
  changeLocale: (nextLocale: Locale) => void;

  tasks: CalendarTask[];
  completedIds: Set<string>;
  toggleTaskCompletion: (taskId: string) => void;
  groups: TaskGroup[];
  visibleCount: number;
  dueSoon: CalendarTask[];

  insights: Insights;
  completionPercent: number;
  busiestDay: number;
  busiestWeek: number;
  busiestCourse: number;
  formattedToday: string;

  calendarName: string | null;
  formattedImportedAt: string | null;
  isImported: boolean;
  hasSavedImport: boolean;
  restoredFromStorage: boolean;

  calendarUrl: string;
  setCalendarUrl: (value: string) => void;
  isLoading: boolean;
  notice: string | null;
  error: string | null;
  handleImport: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  restoreDemo: () => void;
  restoreSavedImport: () => void;
  clearSavedData: () => void;
  exportTasks: () => void;

  remindersEnabled: boolean;
  toggleReminders: () => Promise<void>;

  rememberSource: boolean;
  toggleRememberSource: () => void;
};

const CalendarContext = createContext<CalendarContextValue | null>(null);

export function useCalendar(): CalendarContextValue {
  const value = useContext(CalendarContext);
  if (!value) {
    throw new Error("useCalendar must be used inside <CalendarProvider>");
  }
  return value;
}

/**
 * Holds every piece of calendar state for the whole app.
 *
 * It lives in the root layout rather than in a page so that navigating between
 * routes does not remount it: the imported tasks, completion state, language,
 * and reminder settings all survive navigation without a flash of demo data or
 * a repeated auto-refresh request.
 */
export function CalendarProvider({
  initialNow,
  children,
}: {
  initialNow: string;
  children: ReactNode;
}) {
  const [now, setNow] = useState(() => new Date(initialNow));
  const [locale, setLocale] = useState<Locale>(DEFAULT_LOCALE);
  const [calendarUrl, setCalendarUrl] = useState("");
  const [tasks, setTasks] = useState(() => createDemoTasks(new Date(initialNow)));
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
  // Opt-in only: when false, the feed URL is never written to storage.
  const [rememberSource, setRememberSource] = useState(false);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  function changeLocale(nextLocale: Locale) {
    setLocale(nextLocale);
    saveLocale(window.localStorage, nextLocale);
  }

  /** Show a successful import and cache it, preserving completion state. */
  function applyImportResult(result: CalendarImportResult) {
    const restoredCompleted = restoreCompletedTaskIds(window.localStorage, "imported");
    const eventIds = new Set(result.events.map((event) => event.id));

    setTasks(result.events);
    setCalendarName(result.calendarName);
    setImportedAt(result.importedAt);
    setIsImported(true);
    setHasSavedImport(true);
    setRestoredFromStorage(false);
    saveImportedCalendar(window.localStorage, result);
    setCompletedIds(
      new Set([...restoredCompleted].filter((id) => eventIds.has(id))),
    );
  }

  async function requestImport(sourceUrl: string) {
    const response = await fetch("/api/calendar/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: sourceUrl }),
    });
    const result = (await response.json()) as CalendarImportResult & {
      error?: string;
    };

    if (!response.ok) {
      throw new Error(result.error ?? t(locale, "errors.importFailed"));
    }

    return result;
  }

  async function handleImport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setIsLoading(true);

    try {
      const result = await requestImport(calendarUrl);
      applyImportResult(result);
      if (rememberSource) {
        saveRememberedSource(window.localStorage, calendarUrl);
      }
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

  /** Refresh from a remembered feed on open; never blocks the first paint. */
  async function refreshRememberedSource(sourceUrl: string, activeLocale: Locale) {
    try {
      const result = await requestImport(sourceUrl);
      applyImportResult(result);
      setNotice(
        t(activeLocale, "notices.autoRefreshed", { count: result.events.length }),
      );
    } catch {
      // Offline, or the feed stopped working: keep the cached copy and say so.
      setNotice(t(activeLocale, "notices.autoRefreshFailed"));
    }
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

      // Opt-in auto-refresh: only present when the user explicitly asked for it.
      const remembered = restoreRememberedSource(window.localStorage);
      if (remembered) {
        setRememberSource(true);
        void refreshRememberedSource(remembered.url, restoredLocale);
      }
    }, 0);

    return () => window.clearTimeout(timer);
    // Restore-on-mount must run exactly once. `refreshRememberedSource` is
    // recreated on every render, so listing it here would re-run the whole
    // restore on each render instead of once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const dueSoon = useMemo(() => dueSoonTasks(tasks, now), [tasks, now]);

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

  function toggleRememberSource() {
    if (rememberSource) {
      setRememberSource(false);
      clearRememberedSource(window.localStorage);
      return;
    }

    setRememberSource(true);
    if (isUsableSourceUrl(calendarUrl)) {
      saveRememberedSource(window.localStorage, calendarUrl);
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
    clearRememberedSource(window.localStorage);
    setRememberSource(false);
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

  /** Download exactly what is on screen, as a spreadsheet-friendly CSV. */
  function exportTasks() {
    const csv = CSV_BOM + tasksToCsv(tasks, completedIds);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = exportFileName(now);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
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

  const value: CalendarContextValue = {
    now,
    locale,
    changeLocale,
    tasks,
    completedIds,
    toggleTaskCompletion,
    groups,
    visibleCount,
    dueSoon,
    insights,
    completionPercent,
    busiestDay,
    busiestWeek,
    busiestCourse,
    formattedToday,
    calendarName,
    formattedImportedAt,
    isImported,
    hasSavedImport,
    restoredFromStorage,
    calendarUrl,
    setCalendarUrl,
    isLoading,
    notice,
    error,
    handleImport,
    restoreDemo,
    restoreSavedImport,
    clearSavedData,
    exportTasks,
    remindersEnabled,
    toggleReminders,
    rememberSource,
    toggleRememberSource,
  };

  return <CalendarContext.Provider value={value}>{children}</CalendarContext.Provider>;
}

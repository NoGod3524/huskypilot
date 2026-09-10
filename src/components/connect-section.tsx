"use client";

import { Check, ChevronRight, Link2, LoaderCircle, TriangleAlert } from "lucide-react";

import { useCalendar } from "@/components/calendar-provider";
import { COURSE_COMPONENTS, type CourseComponent } from "@/lib/course-label";
import { t } from "@/lib/i18n";

/** The "connect your HuskyCT calendar" card: URL form, opt-in memory, help, status. */
export function ConnectSection() {
  const {
    locale,
    handleImport,
    calendarUrl,
    setCalendarUrl,
    isLoading,
    error,
    notice,
    rememberSource,
    toggleRememberSource,
    courseLabel,
    updateCourseLabel,
  } = useCalendar();

  return (
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

      <div className="flex items-start gap-2.5 border-t border-[var(--line)] px-5 py-3 sm:px-7">
        <input
          id="remember-calendar"
          type="checkbox"
          checked={rememberSource}
          onChange={toggleRememberSource}
          className="mt-0.5 size-4 shrink-0 cursor-pointer accent-[#2a71d8]"
        />
        <div className="min-w-0">
          <label
            htmlFor="remember-calendar"
            className="text-sm font-semibold text-[#31506f]"
          >
            {t(locale, "connect.rememberLabel")}
          </label>
          <p className="mt-0.5 text-xs leading-5 text-[var(--muted)]">
            {t(locale, "connect.rememberHint")}
          </p>
        </div>
      </div>

      <div className="border-t border-[var(--line)] px-5 py-3 sm:px-7">
        <label htmlFor="course-code" className="text-sm font-semibold text-[#31506f]">
          {t(locale, "course.title")}
        </label>
        <p className="mt-0.5 text-xs leading-5 text-[var(--muted)]">
          {t(locale, "course.hint")}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <input
            id="course-code"
            type="text"
            value={courseLabel?.code ?? ""}
            onChange={(event) =>
              updateCourseLabel(event.target.value, courseLabel?.component ?? null)
            }
            placeholder={t(locale, "course.codePlaceholder")}
            aria-label={t(locale, "course.codeLabel")}
            className="h-9 w-44 rounded-lg border border-[var(--line-strong)] bg-[#fbfcfe] px-3 text-sm outline-none transition focus:border-[#2a71d8] focus:ring-4 focus:ring-[#2a71d8]/10"
          />
          <select
            aria-label={t(locale, "course.component")}
            value={courseLabel?.component ?? ""}
            disabled={!courseLabel}
            onChange={(event) =>
              updateCourseLabel(
                courseLabel?.code ?? "",
                (event.target.value || null) as CourseComponent | null,
              )
            }
            className="h-9 rounded-lg border border-[var(--line-strong)] bg-[#fbfcfe] px-3 text-sm outline-none transition focus:border-[#2a71d8] focus:ring-4 focus:ring-[#2a71d8]/10 disabled:opacity-60"
          >
            <option value="">{t(locale, "course.componentNone")}</option>
            {COURSE_COMPONENTS.map((component) => (
              <option key={component} value={component}>
                {component}
              </option>
            ))}
          </select>
        </div>
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
  );
}

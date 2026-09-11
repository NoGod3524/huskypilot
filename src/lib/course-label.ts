export const COURSE_LABEL_STORAGE_KEY = "huskypilot.courseLabel.v1";
const COURSE_LABEL_VERSION = 1;

const MAX_CODE_LENGTH = 24;

/** Teaching component a course runs, matching what the registrar prints. */
export type CourseComponent = "LEC" | "DIS" | "LAB" | "SEM";

export const COURSE_COMPONENTS: readonly CourseComponent[] = [
  "LEC",
  "DIS",
  "LAB",
  "SEM",
];

/**
 * The course a calendar feed belongs to.
 *
 * Blackboard exports no course name at all — no description, no categories — so
 * a feed can only be identified by the person who subscribed to it. A Blackboard
 * feed is per course, which is why naming it once labels every event in it.
 */
export type CourseLabel = {
  code: string;
  component: CourseComponent | null;
};

export const EMPTY_COURSE_LABEL: CourseLabel = { code: "", component: null };

type StoredCourseLabelPayload = CourseLabel & { version: number };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function isCourseComponent(value: unknown): value is CourseComponent {
  return (
    value === "LEC" || value === "DIS" || value === "LAB" || value === "SEM"
  );
}

/** Collapse and trim a course code, for display and for values read back. */
export function normaliseCourseCode(value: string): string {
  return value.replace(/\s+/g, " ").trim().slice(0, MAX_CODE_LENGTH);
}

/**
 * The code exactly as typed: runs of spaces collapsed and the length capped, but
 * deliberately *not* trimmed. The label is saved on every keystroke, so trimming
 * here would swallow the space the moment someone pressed it and "NRE 1000E"
 * would become "NRE1000E".
 */
function codeAsTyped(value: string): string {
  return value.replace(/\s+/g, " ").slice(0, MAX_CODE_LENGTH);
}

export function parseStoredCourseLabel(rawValue: string): CourseLabel | null {
  try {
    const parsed = JSON.parse(rawValue);
    if (!isRecord(parsed)) return null;
    if (parsed.version !== COURSE_LABEL_VERSION) return null;
    if (typeof parsed.code !== "string") return null;
    if (
      parsed.component !== null &&
      parsed.component !== undefined &&
      !isCourseComponent(parsed.component)
    ) {
      return null;
    }

    const code = normaliseCourseCode(parsed.code);
    if (!code) return null;

    return {
      code,
      component: isCourseComponent(parsed.component) ? parsed.component : null,
    };
  } catch {
    return null;
  }
}

export function restoreCourseLabel(storage: Storage): CourseLabel | null {
  const raw = storage.getItem(COURSE_LABEL_STORAGE_KEY);
  if (!raw) return null;

  const parsed = parseStoredCourseLabel(raw);
  if (!parsed) {
    storage.removeItem(COURSE_LABEL_STORAGE_KEY);
    return null;
  }

  return parsed;
}

/** Stores the label. An all-whitespace code clears it instead of storing a blank. */
export function saveCourseLabel(
  storage: Storage,
  label: CourseLabel,
): CourseLabel | null {
  if (!label.code.trim()) {
    storage.removeItem(COURSE_LABEL_STORAGE_KEY);
    return null;
  }

  const stored: CourseLabel = {
    code: codeAsTyped(label.code),
    component: isCourseComponent(label.component) ? label.component : null,
  };
  const payload: StoredCourseLabelPayload = {
    version: COURSE_LABEL_VERSION,
    ...stored,
  };
  storage.setItem(COURSE_LABEL_STORAGE_KEY, JSON.stringify(payload));

  return stored;
}

export function clearCourseLabel(storage: Storage) {
  storage.removeItem(COURSE_LABEL_STORAGE_KEY);
}

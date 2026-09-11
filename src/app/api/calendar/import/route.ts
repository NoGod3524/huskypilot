import { z } from "zod";

import { parseCalendar } from "@/lib/parse-calendar";
import { fetchCalendarText, SafeFetchError } from "@/lib/safe-fetch";
import { MAX_CALENDAR_FILE_BYTES } from "@/lib/calendar-file";

export const runtime = "nodejs";

/** Room for a file-sized body once JSON has escaped it. */
const MAX_BODY_LENGTH = MAX_CALENDAR_FILE_BYTES + 512 * 1024;

const requestSchema = z.union([
  z.object({ url: z.string().trim().min(1).max(2_048).url() }),
  // A calendar dropped in as a file. Sent as text, parsed and discarded.
  z.object({ ics: z.string().min(1).max(MAX_CALENDAR_FILE_BYTES) }),
]);

function json(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    if (rawBody.length > MAX_BODY_LENGTH) {
      return json({ error: "The request was too large." }, 413);
    }

    const parsedBody = requestSchema.safeParse(JSON.parse(rawBody));
    if (!parsedBody.success) {
      return json({ error: "Enter a complete ICS calendar URL." }, 400);
    }

    // A dropped file is already in hand; a link still has to be fetched, and
    // that is the only path that needs the SSRF guard.
    const calendarText =
      "ics" in parsedBody.data
        ? parsedBody.data.ics
        : await fetchCalendarText(parsedBody.data.url);

    const calendar = await parseCalendar(calendarText);
    return json(calendar);
  } catch (error) {
    if (error instanceof SafeFetchError) {
      return json({ error: error.message }, 400);
    }

    if (error instanceof SyntaxError) {
      return json({ error: "The request was not valid JSON." }, 400);
    }

    console.error("Calendar import failed without logging the private URL.", error);
    return json(
      { error: "We could not read that calendar. Make sure it is a valid ICS feed." },
      422,
    );
  }
}

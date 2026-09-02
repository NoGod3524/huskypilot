import { z } from "zod";

import { parseCalendar } from "@/lib/parse-calendar";
import { fetchCalendarText, SafeFetchError } from "@/lib/safe-fetch";

export const runtime = "nodejs";

const requestSchema = z.object({
  url: z.string().trim().min(1).max(2_048).url(),
});

function json(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    if (rawBody.length > 4_096) {
      return json({ error: "The request was too large." }, 413);
    }

    const parsedBody = requestSchema.safeParse(JSON.parse(rawBody));
    if (!parsedBody.success) {
      return json({ error: "Enter a complete ICS calendar URL." }, 400);
    }

    const calendarText = await fetchCalendarText(parsedBody.data.url);
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

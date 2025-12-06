import type { APIRoute } from "astro";
import { google } from "../../../../lib/oauth";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  // console.log(locals.user)
  // console.log(locals.user.googleAccessToken)
  // if (!locals.user || !locals.user.googleAccessToken) {
  //   return new Response(JSON.stringify({ error: "Unauthorized" }), {
  //     status: 401,
  //   });
  // }

  const { timeMin, timeMax } = await request.json();

  if (!timeMin || !timeMax) {
    return new Response(JSON.stringify({ error: "timeMin and timeMax are required" }), {
      status: 400,
    });
  }

  try {
    const calendarAPI = `https://www.googleapis.com/calendar/v3/freeBusy`;

    const response = await fetch(calendarAPI, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${locals.user.googleAccessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        timeMin,
        timeMax,
        items: [{ id: "primary" }],
      }),
    });

    return new Response(await response.text(), { status: response.status, headers: { "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: "Failed to fetch calendar events" }), { status: 500 });
  }
};
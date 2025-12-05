import type { APIContext } from "astro";
import { drizzle } from "drizzle-orm/d1";
import {
  invalidateSession,
  deleteSessionTokenCookie,
} from "../../../lib/session";

export const prerender = false;

export async function POST(context: APIContext): Promise<Response> {
  if (context.locals.session === null) {
    return new Response(null, { status: 401 });
  }
  const db = drizzle(context.locals.runtime.env.DB);
  await invalidateSession(db, context.locals.session.id);
  deleteSessionTokenCookie(context);
  return new Response();
}

import auth from "#/src/lib/auth";
import type { APIRoute } from "astro"

export const prerender = false;

export const ALL: APIRoute = async (context) => {

  return auth.handler(context.request);
}
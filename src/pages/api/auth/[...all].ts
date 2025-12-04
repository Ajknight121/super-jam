import { auth } from "../../../lib/auth";
import type { APIRoute } from "astro";

export const prerender = false;

export const ALL: APIRoute = async (context) => {
  const betterAuth = auth(context.locals.runtime.env);
  return betterAuth.handler(context.request);
};
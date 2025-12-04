
import type { APIRoute } from "astro"

export const ALL:APIRoute = (context) => {
  console.log(context)
  console.log(context.env.GOOGLE_CLIENT_ID)
  return new Response("Unimplemented", {
    status: 405,
  });
}
// src/pages/api/auth/me.ts
import type { APIRoute } from "astro";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { sessions, users } from "#/src/db/schema";

export const GET: APIRoute = async ({ locals, cookies }) => {
  const sessionToken = cookies.get("session")?.value;

  if (!sessionToken) {
    return new Response(JSON.stringify({ isLoggedIn: false }), { status: 200 });
  }

  try {
    const db = drizzle(locals.runtime.env.DB);

    const [session] = await db
      .select({
        user: {
          name: users.name,
        },
      })
      .from(sessions)
      .where(eq(sessions.id, sessionToken))
      .innerJoin(users, eq(sessions.userId, users.id));

    if (session?.user) {
      return new Response(
        JSON.stringify({ isLoggedIn: true, name: session.user.name }),
        { status: 200 },
      );
    }
  } catch (error) {
    console.error("Database error in /api/auth/me:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }

  return new Response(JSON.stringify({ isLoggedIn: false }), { status: 200 });
};

import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  // baseURL: import.meta.env.PUBLIC_BETTER_AUTH_URL, // e.g. http://localhost:4321
  baseURL: "http://localhost:4321", // e.g. http://localhost:4321
});
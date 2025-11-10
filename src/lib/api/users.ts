import { handleJsonResponse } from "./index";

export async function createUser(
  name: string,
): Promise<{ id: string } | undefined> {
  const res = await fetch(`/api/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });

  return handleJsonResponse(res);
}

export async function getUser(
  userId: string,
): Promise<{ id: string; name: string } | undefined> {
  const res = await fetch(`/api/users/${encodeURIComponent(userId)}`);
  return handleJsonResponse(res);
}

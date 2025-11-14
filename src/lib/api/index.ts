// TODO(samuel-skean): This is a false-sense-of-security type-safety bomb waiting to go off. Basically, if you put any response into it, it will give you back whatever response you want it to return. I'm not sure of a better way to do this, but it's just a shame. I think it would honestly be better for it to return `Promise<unknown | undefined>` to force all users to cast, but I'm not willing to make that call just yet.
export async function handleApiResponse<T>(
  res: Response,
  parseFn?: (json: unknown) => T,
): Promise<T | undefined> {
  if (!res.ok) {
    // Provide a helpful error for 405 vs other errors
    if (res.status === 405) {
      throw new Error(`Endpoint not implemented (405).`);
    }
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
  }

  // 204 No Content - nothing to parse
  if (res.status === 204) {
    return undefined;
  }

  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const json = await res.json().catch(() => {
      throw new Error(`Response did not contain JSON.`);
    });

    return parseFn ? parseFn(json) : (json as T);
  }

  // For endpoints that return plain text
  if (contentType.startsWith("text/") || contentType === "") {
    const txt = await res.text().catch(() => "");

    return parseFn ? parseFn(txt) : (txt as T);
  }

  // Fallback - try JSON but give a helpful message on parse failures
  try {
    console.log(
      "WARNING: Incorrectly set 'Content-Type', trying to parse as JSON.",
    );
    const json = await res.json();
    return parseFn ? parseFn(json) : (json as T);
  } catch {
    throw new Error(
      `Response had unsupported content-type: ${contentType} (not JSON).`,
    );
  }
}

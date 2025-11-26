// TODO(samuel-skean): This is a false-sense-of-security type-safety bomb waiting to go off. Basically, if you put any response into it, it will give you back whatever response you want it to return. I'm not sure of a better way to do this, but it's just a shame. I think it would honestly be better for it to return `Promise<unknown | undefined>` to force all users to cast, but I'm not willing to make that call just yet.
// TODO(samuel-skean): The bomb went off. I defused it in this commit.
export async function handleApiResponse<T>(
  res: Response,
  parseFn?: (json: unknown) => T,
): Promise<T | (T & { id: string }) | undefined> {
  if (!res.ok) {
    // Provide a helpful error for 405 vs other errors
    if (res.status === 405) {
      throw new Error(`Endpoint not implemented (405).`);
    }
    // TODO: Is this error handling achieving anything?
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
  }

  // 204 No Content - nothing to parse
  if (res.status === 204) {
    return undefined;
  }

  let responseBody: unknown;

  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const json = await res.json().catch(() => {
      throw new Error(`Response did not contain JSON.`);
    });

    responseBody = json;
  } else if (contentType.startsWith("text/") || contentType === "") {
    // For endpoints that return plain text
    // TODO: Is this error handling achieving anything?
    const txt = await res.text().catch(() => "");

    responseBody = txt;
  } else {
    // Fallback - try JSON but give a helpful message on parse failures
    try {
      console.log(
        "WARNING: Incorrectly set 'Content-Type', trying to parse as JSON.",
      );
      const json = await res.json();
      responseBody = json;
    } catch {
      throw new Error(
        `Response had unsupported content-type: ${contentType} (not JSON).`,
      );
    }
  }

  const parsedResponse = parseFn ? parseFn(responseBody) : (responseBody as T);

  if (res.status === 201 /* Created */) {
    // biome-ignore lint/style/noNonNullAssertion: If the server doesn't give us this, it is misbehaved.
    const location = res.headers.get("location")!;
    const locationComponentsWithoutEmptyStrings = new URL(
      location,
      window.location.origin,
    ).pathname
      .split("/")
      .filter(Boolean);
    const lastComponentOfLocation =
      // biome-ignore lint/style/noNonNullAssertion: If the path doesn't have a final component, the server is misbehaved.
      locationComponentsWithoutEmptyStrings.pop()!;
    return {
      ...parsedResponse,
      id: lastComponentOfLocation,
    };
  } else {
    return parsedResponse;
  }
}

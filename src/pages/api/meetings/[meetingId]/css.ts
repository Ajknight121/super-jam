import type { APIRoute } from "astro";
import CleanCSS from "clean-css";

export const prerender = false;

const cleanCss = new CleanCSS({
  level: 1, // Basic optimizations, good for security cleaning
});

const getObjectKey = (meetingId: string) => `meetings/${meetingId}.css`;

export const PUT: APIRoute = async ({ params, request, locals }) => {
  const { meetingId } = params;
  if (!meetingId) {
    return new Response("Meeting ID is required", { status: 400 });
  }

  const bucket: R2Bucket = locals.runtime.env["css-bucket"] as R2Bucket;
  const rawCss = await request.text();

  const cleaned = cleanCss.minify(rawCss);

  if (cleaned.errors.length > 0) {
    return new Response(`CSS Error: ${cleaned.errors.join(", ")}`, {
      status: 400,
    });
  }

  await bucket.put(getObjectKey(meetingId), cleaned.styles);

  return new Response(`Successfully uploaded stylesheet for ${meetingId}`);
};

export const GET: APIRoute = async ({ params, locals }) => {
  const { meetingId } = params;
  if (!meetingId) {
    return new Response("Meeting ID is required", { status: 400 });
  }

  const bucket: R2Bucket = locals.runtime.env["css-bucket"] as R2Bucket;
  const objectKey = getObjectKey(meetingId);

  const cssFile = await bucket.get(objectKey);

  if (cssFile === null) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(cssFile.body, {
    headers: { "Content-Type": "text/css" },
  });
};

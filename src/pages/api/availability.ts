export const GET = () => {
  return new Response("This should really return availability.", {
    status: 405,
  });
};

export const POST = () => {
  return new Response(
    "This should really let the users post their availability.",
    { status: 405 },
  );
};

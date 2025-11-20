// Low priority.
// This should allow for getting and setting the name of an event by itself. It should just deal in strings.
export const prerender = false;

export const GET = async (): Promise<Response> => {
  return new Response("Unimplemented", {
    status: 405,
  });
};

export const PUT = async (): Promise<Response> => {
  return new Response("Unimplemented", {
    status: 405,
  });
};

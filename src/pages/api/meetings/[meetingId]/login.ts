import { unsupportedMethodResponse } from "#/src/api-types-and-schemas";

export const prerender = false;

// TODO
// How to handle shenanigans with trying to login as a user that already exists but was created with OIDC?
export const POST = () => {
  return new Response("Unimplemented.", { status: 405 });
};

export const GET = () => {
  return unsupportedMethodResponse("Try POST.");
};

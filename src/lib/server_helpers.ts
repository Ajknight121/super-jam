import type { AstroCookies } from "astro";
import { genSalt, hash } from "bcrypt-ts";
import {
  type AuthCookie,
  AuthCookieSchema,
  type HashedPassword,
  HashedPasswordSchema,
  type MeetingId,
  type Password,
} from "../api-types-and-schemas";

// Does more than just hash the password, but I name it this because I'm lazy and to be consistent with the other things.
export const hashPassword = async (
  password: Password,
): Promise<HashedPassword> => {
  // Heavily inspired by https://github.com/acm-uic/WebMinigames/blob/551faa90d13ff34504c3170319bd4497d2b09d48/backend/controllers/user.js#L24-L27, and I don't know the underlying math or theory much.
  const saltRounds = 10;
  const salt = await genSalt(saltRounds);
  // NOTE: The below `.parse` is entirely overhead, I'm just adding it to be safe.
  const hashedPassword = HashedPasswordSchema.parse(await hash(password, salt));
  return hashedPassword;
};

export const getAuthCookie = (
  cookies: AstroCookies,
  meetingId: MeetingId,
): AuthCookie | undefined => {
  const cookieString = cookies.get(
    `auth-cookie-for-meeting-${meetingId}`,
  )?.value;

  if (cookieString === undefined) {
    return undefined;
  }

  const authCookieResult = AuthCookieSchema.safeParse(cookieString);
  if (authCookieResult.error) {
    // TODO: Handle this better, give the client a specific error?
    return undefined;
  }

  return authCookieResult.data;
};

export const setAuthCookie = (
  cookies: AstroCookies,
  meetingId: MeetingId,
  authCookie: AuthCookie,
) => {
  cookies.set(`auth-cookie-for-meeting-${meetingId}`, authCookie, {
    httpOnly: true,
    secure: true,
    // TODO: Does this lead to the user losing their logged-in-ness if they leave the site and then follow a link back? (I think it would.) If so, is it worth changing this to "lax"?
    sameSite: "strict",
  });
};

// Types and Zod schemas for things shared frontend and backend.
// Not all of the validation logic is here! Some is too complicated to be easily expressed in Zod (it would be voodoo IMO, though I do understand it). See https://chatgpt.com/s/t_690646e3ec608191bc1114d90d95e02a, especially paragraph 1, for how to do it. (I only read paragraph 1.)

import assert from "node:assert";
import * as zod from "zod/mini";

// Number of seconds of granularity for any times.
export const GRANULARITY = 15 /*minutes */ * 60; /* seconds per minute */

// A helper for confirming that all the elements of an array of numbers or strings are unique.
const allUnique = (arr: (number | string)[]) =>
  new Set(arr).size === arr.length;

const isOnJan1st1970 = (date: Date) =>
  date.getUTCMonth() === 1 &&
  date.getUTCDate() === 1 &&
  date.getUTCFullYear() === 1970;

// All timestamps in the API are ISO-8601 timestamps with second precision, ending with "Z" (meaning they are UTC time).
const TimeSchema = zod.string().check(
  zod.iso.datetime({ offset: false, local: false, precision: 0 }),
  // All times are multiples of the GRANULARITY.
  zod.refine((time) => +new Date(time) % GRANULARITY === 0),
);

const TimesSchema = zod.array(TimeSchema).check(zod.refine(allUnique));

// It seems Kanich doesn't love this idea, but I (Skean) feel pretty strongly for it: https://piazza.com/class/mdt3addszda1is/post/78
//
// This is a JSON array of the time-slots for which one user is available for one meeting.
// These time-slots are the beginnings of 15-minute chunks, for which the user is available.
//
// ```json
// ["2025-11-03T18:45:00Z","2025-11-03T19:00:00Z","2025-11-03T19:15:00Z","2025-11-03T19:30:00Z","2025-11-03T19:45:00Z","2025-11-03T20:00:00Z","2025-11-03T20:15:00Z","2025-11-03T20:30:00Z"]
// ```
export const UserAvailabilitySchema = TimesSchema;
export type UserAvailability = zod.infer<typeof UserAvailabilitySchema>;

// This is an object that stores everyone's availabilities for one meeting.
// It should look something like this:
// ```json
// {
//   "[userId1]" : ["2025-11-03T18:45:00Z", "2025-11-03T19:00:00Z","2025-11-03T19:15:00Z","2025-11-03T19:30:00Z","2025-11-03T19:45:00Z","2025-11-03T20:00:00Z","2025-11-03T20:15:00Z","2025-11-03T20:30:00Z"],
//   "[userId2]" : ["2025-11-03T18:45:00Z","2025-11-03T19:00:00Z","2025-11-03T19:15:00Z","2025-11-03T19:30:00Z","2025-11-03T19:45:00Z","2025-11-03T20:00:00Z","2025-11-03T20:15:00Z","2025-11-03T20:30:00Z"]
// }
// ```
// That's a "map" (JSON object) from user ids to their availabilities. The availabilities are arrays of timestamps, each one representing a 15-minute chunk for which that person is available.
//
// The order of the timestamps in the array is not significant, but we should endeavor to produce arrays with ascending timestamps. (an instance of the [Robustness Principle](https://en.wikipedia.org/wiki/Robustness_principle))
export const MeetingAvailabilitySchema = zod
  .record(zod.nanoid(), UserAvailabilitySchema)
  .check(
    zod.overwrite((obj: object) =>
      Object.fromEntries(Object.entries(obj).sort()),
    ),
  );

export type MeetingAvailability = zod.infer<typeof MeetingAvailabilitySchema>;

const DayOfTheWeek = zod.enum([
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
]);
export type DayOfTheWeek = zod.infer<typeof DayOfTheWeek>;

const AvailableDayConstraintsSchema = zod.discriminatedUnion("type", [
  zod.object({
    type: zod.literal("specificDays"),
    // The timestamps of the starts of the days, in UTC.
    days: TimesSchema,
  }),
  zod.object({
    type: zod.literal("daysOfWeek"),
    days: zod.array(DayOfTheWeek).check(zod.refine(allUnique)),
  }),
]);
export type AvailableDayConstraints = zod.infer<
  typeof AvailableDayConstraintsSchema
>;

const TimeRangeSchema = zod
  .object({
    start: TimeSchema,
    end: TimeSchema,
  })
  .check(
    // The start of the time range must be before (*actually* before) the end of the time range.
    zod.refine(
      (timeRange) => +new Date(timeRange.start) < +new Date(timeRange.end),
    ),
    // Must both be on Jan 1st, 1970.
    zod.refine(
      (timeRange) =>
        isOnJan1st1970(new Date(timeRange.start)) &&
        isOnJan1st1970(new Date(timeRange.end)),
    ),
  );
export type TimeRange = zod.infer<typeof TimeRangeSchema>;

export const AvailabilityContraintsSchema = zod.object({
  availableDayConstraints: AvailableDayConstraintsSchema,
  timeRangeForEachDay: TimeRangeSchema,
});

export type AvailabilityContraints = zod.infer<
  typeof AvailabilityContraintsSchema
>;

export const IanaTimezoneSchema = zod.string().check(
  zod.refine(
    (val) => {
      // STRETCH: Support other locales.
      try {
        new Intl.DateTimeFormat("en-us", { timeZone: val });
        return true;
      } catch {
        return false;
      }
    },
    {
      message: "invalid time zone",
    },
  ),
);

export const MeetingSchema = zod.object({
  // Meeting names must be at least one character long.
  name: zod.string().check(zod.minLength(1)),
  availability: MeetingAvailabilitySchema,
  availabilityBounds: AvailabilityContraintsSchema,
  timeZone: IanaTimezoneSchema,
});
export type Meeting = zod.infer<typeof MeetingSchema>;

export const UserSchema = zod.object({
  defaultName: zod.string().check(zod.minLength(1)),
  // STRETCH: Support different names for each meeting. This may be the most sensitive data we deal with, honestly!
});
export type User = zod.infer<typeof UserSchema>;

// Errors:

const MakemeetErrorSchema = zod.looseObject({
  // We could validate better, but as it stands, this Schema doesn't actually get used to do anything but infer the type, so that would be lost and lazy.
  customMakemeetErrorMessage: zod.string(),
});

export type MakemeetError = zod.infer<typeof MakemeetErrorSchema>;

export const noSuchUserResponse = Response.json(
  {
    customMakemeetErrorMessage: "No such user.",
  } satisfies MakemeetError,
  { status: 404 },
);

export const noSuchMeetingResponse = Response.json(
  {
    customMakemeetErrorMessage: "No such meeting.",
  } satisfies MakemeetError,
  { status: 404 },
);

export const undefinedInRequiredURLParamResponse = Response.json(
  {
    customMakemeetErrorMessage:
      "One of the `params` in the APIContext was undefined. This is unexpected! Please let the devs know. If you are a dev, this contradicts https://chatgpt.com/share/691e4f15-4c7c-8006-a55b-c58efcb9a073 (though ChatGPT couldn't give me a satisfactory source there.",
  } satisfies MakemeetError,
  {
    status: 500,
  },
);

export const jsonParseErrorResponse = (e: unknown) => {
  assert(e instanceof TypeError || e instanceof SyntaxError);
  return Response.json(
    {
      customMakemeetErrorMessage:
        "`request.json()` failed. Most likely the request payload wasn't valid json or the requests had invalid headers. See https://developer.mozilla.org/en-US/docs/Web/API/Request/json for more info.",
      // TODO(samuel-skean): Return the error https://chatgpt.com/c/691e88d2-1368-8333-996e-60035e993e55 https://chatgpt.com/share/691e89cf-4730-8006-af88-4e326a1d151c.
    } satisfies MakemeetError,
    { status: 400 },
  );
};

export const zodErrorResponse = (zodError: zod.core.$ZodError) => {
  return Response.json(
    {
      customMakemeetErrorMessage:
        "Validation error (produced by zod) in field `validationError`.",
      validationError: JSON.parse(zodError.message),
    } satisfies MakemeetError,
    {
      status: 400,
    },
  );
};

import {
  int,
  primaryKey,
  sqliteTable,
  text,
  unique,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const meetings = sqliteTable("meetings", {
  id: text().primaryKey(), // nanoID
  jsonData: text().notNull(),
});

export const users = sqliteTable("users", {
  id: text().primaryKey(), // nanoID
  defaultName: text().notNull(),
});

export const availabilities = sqliteTable(
  "availabilities",
  {
    meetingId: text().references(() => meetings.id),
    userId: text().references(() => users.id),
    nameOverride: text(),
    orderOfIdenticalNamesWithinMeeting: int(),
  },
  (table) => [
    primaryKey({
      columns: [table.meetingId, table.userId],
    }),
    unique("meetingId").on(
      table.meetingId,
      table.nameOverride,
      table.orderOfIdenticalNamesWithinMeeting,
    ),
  ],
);

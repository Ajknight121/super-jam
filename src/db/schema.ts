import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const meetings = sqliteTable("meetings", {
  id: text().primaryKey(), // meetingId (nanoID)
  jsonData: text().notNull(),
});

export const users = sqliteTable("users", {
  authId: text().primaryKey(), // authId (nanoID)
  defaultName: text().notNull(),
  googleKeys: text().notNull(), // TODO(Ajknight121): Samuel Skean here. I'm not sure what you want here, so this is just my best guess.
});

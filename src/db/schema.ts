import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const meetings = sqliteTable("meetings", {
  id: text().primaryKey(), // nanoID
  jsonData: text().notNull(),
});

export const users = sqliteTable("users", {
  id: text().primaryKey(), // nanoID
  defaultName: text().notNull(),
});

import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const events = sqliteTable("events", {
  id: text().primaryKey(), // UUID
  jsonData: text().notNull(),
});

export const users = sqliteTable("users", {
  id: text().primaryKey(), // UUID
  name: text().notNull(),
});

import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

export const meetings = sqliteTable("meetings", {
  id: text().primaryKey(), // nanoID
  jsonData: text().notNull(),
});

export const users = sqliteTable("users", {
  id: text("id").primaryKey(), // nanoID
  googleId: text("google_id").unique(),
  name: text("name"),
  email: text("email"),
  googleAccessToken: text("google_access_token"),
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
}));

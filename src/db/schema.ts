import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

export const meetings = sqliteTable("meetings", {
  id: text("id").primaryKey(), // nanoID
  jsonData: text("jsonData").notNull(),
});

export const users = sqliteTable("users", {
  id: text("id").primaryKey(), // nanoID
  googleId: text("google_id").unique(),
  email: text("email").notNull().unique(),
  name: text("name"),
  avatarUrl: text("avatar_url"),
  // It is highly recommended to encrypt these tokens before storing them.
  googleAccessToken: text("google_access_token"),
  googleRefreshToken: text("google_refresh_token"),
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

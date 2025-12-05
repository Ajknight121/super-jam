CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_users` (
	`id` text PRIMARY KEY NOT NULL,
	`google_id` text,
	`email` text NOT NULL,
	`name` text,
	`avatar_url` text,
	`google_access_token` text,
	`google_refresh_token` text
);
--> statement-breakpoint
INSERT INTO `__new_users`("id", "google_id", "email", "name", "avatar_url", "google_access_token", "google_refresh_token") SELECT "id", "google_id", "email", "name", "avatar_url", "google_access_token", "google_refresh_token" FROM `users`;--> statement-breakpoint
DROP TABLE `users`;--> statement-breakpoint
ALTER TABLE `__new_users` RENAME TO `users`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `users_google_id_unique` ON `users` (`google_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);
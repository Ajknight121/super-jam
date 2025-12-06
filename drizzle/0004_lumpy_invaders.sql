DROP INDEX `users_email_unique`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `email`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `avatar_url`;
CREATE TABLE `events` (
	`id` text PRIMARY KEY NOT NULL,
	`jsonData` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL
);

CREATE TABLE `companies` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`address` text NOT NULL,
	`phone` text NOT NULL,
	`postal_code` text NOT NULL,
	`contact_person` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);

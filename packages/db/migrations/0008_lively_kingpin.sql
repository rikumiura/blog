CREATE TABLE `pending_body_key_deletions` (
	`body_key` text PRIMARY KEY NOT NULL,
	`queued_at` text NOT NULL
);

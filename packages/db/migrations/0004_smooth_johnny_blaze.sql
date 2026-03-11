PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_tags` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	CONSTRAINT "tag_name_check" CHECK(length(trim("__new_tags"."name")) > 0 AND length(trim("__new_tags"."name")) <= 30)
);
--> statement-breakpoint
INSERT INTO `__new_tags`("id", "name") SELECT "id", "name" FROM `tags`;--> statement-breakpoint
DROP TABLE `tags`;--> statement-breakpoint
ALTER TABLE `__new_tags` RENAME TO `tags`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `tags_name_unique` ON `tags` (`name`);
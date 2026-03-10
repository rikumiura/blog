PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_article_tags` (
	`article_id` text NOT NULL,
	`tag_id` text NOT NULL,
	PRIMARY KEY(`article_id`, `tag_id`),
	FOREIGN KEY (`article_id`) REFERENCES `articles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_article_tags`("article_id", "tag_id") SELECT "article_id", "tag_id" FROM `article_tags`;--> statement-breakpoint
DROP TABLE `article_tags`;--> statement-breakpoint
ALTER TABLE `__new_article_tags` RENAME TO `article_tags`;--> statement-breakpoint
PRAGMA foreign_keys=ON;
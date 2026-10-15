CREATE TABLE `health_conversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(160) NOT NULL,
	`language` varchar(8) NOT NULL DEFAULT 'en',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `health_conversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `health_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversationId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('user','assistant') NOT NULL,
	`content` text NOT NULL,
	`language` varchar(8) NOT NULL,
	`source` enum('live','fallback','safety') NOT NULL DEFAULT 'live',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `health_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `health_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tokenHash` varchar(64) NOT NULL,
	`userId` int NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `health_sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `health_sessions_tokenHash_unique` UNIQUE(`tokenHash`)
);
--> statement-breakpoint
CREATE TABLE `symptom_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`originalDescription` text NOT NULL,
	`language` varchar(8) NOT NULL,
	`structuredSummary` text NOT NULL,
	`nextSteps` text NOT NULL,
	`source` enum('live','fallback','safety') NOT NULL DEFAULT 'live',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `symptom_reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `openId` varchar(64);--> statement-breakpoint
ALTER TABLE `users` ADD `username` varchar(32);--> statement-breakpoint
ALTER TABLE `users` ADD `passwordHash` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `preferredLanguage` varchar(8) DEFAULT 'en' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_username_unique` UNIQUE(`username`);--> statement-breakpoint
ALTER TABLE `health_conversations` ADD CONSTRAINT `health_conversations_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `health_messages` ADD CONSTRAINT `health_messages_conversationId_health_conversations_id_fk` FOREIGN KEY (`conversationId`) REFERENCES `health_conversations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `health_messages` ADD CONSTRAINT `health_messages_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `health_sessions` ADD CONSTRAINT `health_sessions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `symptom_reports` ADD CONSTRAINT `symptom_reports_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `health_conversations_user_idx` ON `health_conversations` (`userId`);--> statement-breakpoint
CREATE INDEX `health_messages_conversation_idx` ON `health_messages` (`conversationId`,`id`);--> statement-breakpoint
CREATE INDEX `health_messages_user_idx` ON `health_messages` (`userId`);--> statement-breakpoint
CREATE INDEX `health_sessions_user_idx` ON `health_sessions` (`userId`);--> statement-breakpoint
CREATE INDEX `symptom_reports_user_idx` ON `symptom_reports` (`userId`);
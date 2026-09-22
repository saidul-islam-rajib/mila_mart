CREATE TABLE `websiteSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`settingKey` varchar(80) NOT NULL,
	`settingValue` text NOT NULL,
	`isPublic` boolean NOT NULL DEFAULT true,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`updatedBy` varchar(128),
	CONSTRAINT `websiteSettings_id` PRIMARY KEY(`id`),
	CONSTRAINT `websiteSettings_settingKey_unique` UNIQUE(`settingKey`)
);

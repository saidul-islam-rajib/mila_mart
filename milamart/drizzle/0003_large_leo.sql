CREATE TABLE `decorPreviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`requestId` varchar(64) NOT NULL,
	`sourceImageKey` varchar(512) NOT NULL,
	`sourceImageMimeType` varchar(32) NOT NULL,
	`photoType` enum('furniture','room') NOT NULL,
	`subjectType` varchar(80),
	`stylePreference` varchar(80),
	`budgetPreference` varchar(80),
	`consentedAt` timestamp NOT NULL,
	`status` enum('uploaded','analyzing','ready','generating','complete','failed') NOT NULL DEFAULT 'uploaded',
	`recommendationJson` text,
	`generatedPreviewKey` varchar(512),
	`errorMessage` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `decorPreviews_id` PRIMARY KEY(`id`),
	CONSTRAINT `decorPreviews_requestId_unique` UNIQUE(`requestId`)
);

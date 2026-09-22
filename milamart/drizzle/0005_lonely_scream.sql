CREATE TABLE `financeRecurringProfiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`recurringProfileId` varchar(48) NOT NULL,
	`entryType` enum('revenue','expense') NOT NULL,
	`category` enum('advertising','salary','product_cost','materials','packaging','rent','courier','service_income','digital_payment','other') NOT NULL,
	`platform` varchar(120),
	`campaign` varchar(160),
	`counterparty` varchar(160),
	`referenceId` varchar(160),
	`paymentMethod` enum('cash','bkash','nagad','rocket','bank','card','pathao','other') NOT NULL DEFAULT 'cash',
	`amount` decimal(12,2) NOT NULL,
	`description` text NOT NULL,
	`startDate` timestamp NOT NULL,
	`status` enum('active','paused') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `financeRecurringProfiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `financeRecurringProfiles_recurringProfileId_unique` UNIQUE(`recurringProfileId`)
);
--> statement-breakpoint
ALTER TABLE `financeTransactions` ADD `recurringProfileId` varchar(48);
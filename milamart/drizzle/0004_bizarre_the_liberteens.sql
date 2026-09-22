CREATE TABLE `financeTransactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`transactionId` varchar(48) NOT NULL,
	`transactionDate` timestamp NOT NULL,
	`entryType` enum('revenue','expense') NOT NULL,
	`category` enum('advertising','salary','product_cost','materials','packaging','rent','courier','service_income','digital_payment','other') NOT NULL,
	`platform` varchar(120),
	`campaign` varchar(160),
	`counterparty` varchar(160),
	`referenceId` varchar(160),
	`paymentMethod` enum('cash','bkash','nagad','rocket','bank','card','pathao','other') NOT NULL DEFAULT 'cash',
	`recurrence` enum('none','monthly') NOT NULL DEFAULT 'none',
	`amount` decimal(12,2) NOT NULL,
	`description` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `financeTransactions_id` PRIMARY KEY(`id`),
	CONSTRAINT `financeTransactions_transactionId_unique` UNIQUE(`transactionId`)
);

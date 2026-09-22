CREATE TABLE `manualOrders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderNumber` varchar(32) NOT NULL,
	`customerName` varchar(160) NOT NULL,
	`customerPhone` varchar(40) NOT NULL,
	`customerEmail` varchar(320),
	`deliveryAddress` text,
	`productSummary` text NOT NULL,
	`dimensions` varchar(200),
	`quantity` int NOT NULL DEFAULT 1,
	`source` enum('website','phone','whatsapp','walk_in') NOT NULL DEFAULT 'phone',
	`deliveryMode` enum('home','courier','pickup') NOT NULL DEFAULT 'courier',
	`status` enum('new','confirmed','processing','delivered','cancelled') NOT NULL DEFAULT 'new',
	`paymentStatus` enum('unpaid','partial','paid') NOT NULL DEFAULT 'unpaid',
	`orderValue` decimal(12,2) NOT NULL,
	`prepaymentAmount` decimal(12,2) NOT NULL DEFAULT '0.00',
	`shopifyOrderId` varchar(120),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `manualOrders_id` PRIMARY KEY(`id`),
	CONSTRAINT `manualOrders_orderNumber_unique` UNIQUE(`orderNumber`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);

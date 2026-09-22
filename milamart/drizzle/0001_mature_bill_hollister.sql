ALTER TABLE `manualOrders` ADD `businessOrderId` varchar(64);--> statement-breakpoint
ALTER TABLE `manualOrders` ADD `district` varchar(120);--> statement-breakpoint
ALTER TABLE `manualOrders` ADD `policeStation` varchar(120);--> statement-breakpoint
ALTER TABLE `manualOrders` ADD `locality` varchar(160);--> statement-breakpoint
ALTER TABLE `manualOrders` ADD `productCode` varchar(80);--> statement-breakpoint
ALTER TABLE `manualOrders` ADD `serviceSpecifications` text;--> statement-breakpoint
ALTER TABLE `manualOrders` ADD `unitLabel` varchar(30) DEFAULT 'pcs' NOT NULL;--> statement-breakpoint
ALTER TABLE `manualOrders` ADD `preferredServiceTime` varchar(500);--> statement-breakpoint
ALTER TABLE `manualOrders` ADD `paymentMethod` enum('cod','mobile_banking','bank_transfer','online_card','other') DEFAULT 'cod' NOT NULL;--> statement-breakpoint
ALTER TABLE `manualOrders` ADD `deliveryCharge` decimal(12,2) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE `manualOrders` ADD CONSTRAINT `manualOrders_businessOrderId_unique` UNIQUE(`businessOrderId`);
ALTER TABLE `manualOrders` ADD `stickerType` varchar(80);--> statement-breakpoint
ALTER TABLE `manualOrders` ADD `stickerMeasurements` text;--> statement-breakpoint
ALTER TABLE `manualOrders` ADD `calculatedSquareFeet` decimal(12,2);--> statement-breakpoint
ALTER TABLE `manualOrders` ADD `unitPrice` decimal(12,2);--> statement-breakpoint
ALTER TABLE `manualOrders` ADD `customSquareFeet` decimal(12,2);--> statement-breakpoint
ALTER TABLE `manualOrders` ADD `deliveryOption` varchar(40);--> statement-breakpoint
ALTER TABLE `manualOrders` ADD `paymentProvider` varchar(80);--> statement-breakpoint
ALTER TABLE `manualOrders` ADD `paymentReference` varchar(160);--> statement-breakpoint
ALTER TABLE `manualOrders` ADD `paymentProofKey` varchar(512);
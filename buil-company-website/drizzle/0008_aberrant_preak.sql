ALTER TABLE `manualOrders` ADD `assignedTo` varchar(160);--> statement-breakpoint
ALTER TABLE `manualOrders` ADD `internalNotes` text;--> statement-breakpoint
ALTER TABLE `manualOrders` ADD `complaintNote` text;--> statement-breakpoint
ALTER TABLE `manualOrders` ADD `followUpAt` timestamp;
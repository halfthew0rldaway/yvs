ALTER TABLE `TiketServis` ADD COLUMN `harapan_pelanggan` TEXT NULL;
CREATE INDEX `CustomerRegistration_ticket_id_idx` ON `CustomerRegistration`(`ticket_id`);
ALTER TABLE `CustomerRegistration` ADD CONSTRAINT `CustomerRegistration_ticket_id_fkey` FOREIGN KEY (`ticket_id`) REFERENCES `TiketServis`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

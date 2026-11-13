CREATE TABLE `CustomerRegistration` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `token_hash` CHAR(64) NOT NULL,
    `issued_by` INTEGER NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `submitted_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `customer_id` INTEGER NULL,
    `perangkat_id` INTEGER NULL,
    `keluhan` TEXT NULL,
    `harapan` TEXT NULL,
    `ticket_id` INTEGER NULL,
    UNIQUE INDEX `CustomerRegistration_token_hash_key`(`token_hash`),
    INDEX `CustomerRegistration_submitted_at_ticket_id_idx`(`submitted_at`, `ticket_id`),
    INDEX `CustomerRegistration_expires_at_idx`(`expires_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `CustomerRegistration` ADD CONSTRAINT `CustomerRegistration_issued_by_fkey` FOREIGN KEY (`issued_by`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `CustomerRegistration` ADD CONSTRAINT `CustomerRegistration_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `Customer`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `CustomerRegistration` ADD CONSTRAINT `CustomerRegistration_perangkat_id_fkey` FOREIGN KEY (`perangkat_id`) REFERENCES `Perangkat`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

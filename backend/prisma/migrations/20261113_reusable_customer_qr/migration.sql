ALTER TABLE `CustomerRegistration`
    ADD COLUMN `nama` VARCHAR(100) NULL,
    ADD COLUMN `nomor_telepon` VARCHAR(20) NULL,
    ADD COLUMN `pending_phone` VARCHAR(20) NULL,
    ADD COLUMN `alamat` VARCHAR(255) NULL,
    ADD COLUMN `jenis_perangkat` VARCHAR(80) NULL,
    ADD COLUMN `merek` VARCHAR(100) NULL,
    ADD COLUMN `model` VARCHAR(100) NULL,
    ADD COLUMN `serial_number` VARCHAR(100) NULL,
    ADD COLUMN `status` VARCHAR(20) NOT NULL DEFAULT 'pending',
    ADD COLUMN `reviewed_at` DATETIME(3) NULL,
    ADD COLUMN `reviewed_by` INTEGER NULL;

UPDATE `CustomerRegistration` r
JOIN `Customer` c ON c.id = r.customer_id
JOIN `Perangkat` p ON p.id = r.perangkat_id
SET r.nama = c.nama, r.nomor_telepon = c.nomor_telepon, r.alamat = c.alamat,
    r.jenis_perangkat = p.jenis_perangkat, r.merek = p.merek,
    r.model = p.model, r.serial_number = p.serial_number,
    r.status = 'accepted'
WHERE r.submitted_at IS NOT NULL;

ALTER TABLE `CustomerRegistration`
    MODIFY COLUMN `token_hash` CHAR(64) NULL,
    MODIFY COLUMN `issued_by` INTEGER NULL,
    MODIFY COLUMN `expires_at` DATETIME(3) NULL,
    ADD UNIQUE INDEX `CustomerRegistration_pending_phone_key`(`pending_phone`),
    ADD INDEX `CustomerRegistration_status_submitted_at_idx`(`status`, `submitted_at`),
    ADD INDEX `CustomerRegistration_nomor_telepon_status_idx`(`nomor_telepon`, `status`),
    ADD INDEX `CustomerRegistration_reviewed_by_idx`(`reviewed_by`);

ALTER TABLE `CustomerRegistration` ADD CONSTRAINT `CustomerRegistration_reviewed_by_fkey` FOREIGN KEY (`reviewed_by`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

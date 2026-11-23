-- CreateTable
CREATE TABLE `Chat` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `first_user_id` INTEGER NOT NULL,
    `second_user_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Chat_first_user_id_second_user_id_key`(`first_user_id`, `second_user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ChatMember` (
    `chat_id` INTEGER NOT NULL,
    `user_id` INTEGER NOT NULL,
    `joined_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `last_read_at` DATETIME(3) NULL,

    INDEX `ChatMember_user_id_idx`(`user_id`),
    PRIMARY KEY (`chat_id`, `user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ChatMessage` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `chat_id` INTEGER NOT NULL,
    `sender_id` INTEGER NULL,
    `sender_name` VARCHAR(255) NOT NULL,
    `body` TEXT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ChatMessage_chat_id_id_idx`(`chat_id`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Chat` ADD CONSTRAINT `Chat_first_user_id_fkey` FOREIGN KEY (`first_user_id`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Chat` ADD CONSTRAINT `Chat_second_user_id_fkey` FOREIGN KEY (`second_user_id`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChatMember` ADD CONSTRAINT `ChatMember_chat_id_fkey` FOREIGN KEY (`chat_id`) REFERENCES `Chat`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChatMember` ADD CONSTRAINT `ChatMember_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChatMessage` ADD CONSTRAINT `ChatMessage_chat_id_fkey` FOREIGN KEY (`chat_id`) REFERENCES `Chat`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChatMessage` ADD CONSTRAINT `ChatMessage_sender_id_fkey` FOREIGN KEY (`sender_id`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;


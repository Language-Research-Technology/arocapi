-- Drop foreign key constraint
ALTER TABLE `file` DROP FOREIGN KEY `file_entityId_fkey`;

-- Drop unique constraints that reference old columns
DROP INDEX `entity_rocrateId_key` ON `entity`;
DROP INDEX `file_fileId_key` ON `file`;

-- Entity: drop auto-increment PK, rename rocrateId to id, make it the PK
ALTER TABLE `entity` DROP PRIMARY KEY,
    DROP COLUMN `id`,
    CHANGE COLUMN `rocrateId` `id` VARCHAR(768) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- File: drop auto-increment PK, rename fileId to id, make it the PK
ALTER TABLE `file` DROP PRIMARY KEY,
    DROP COLUMN `id`,
    CHANGE COLUMN `fileId` `id` VARCHAR(768) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- Re-add foreign key referencing the renamed Entity.id
ALTER TABLE `file` ADD CONSTRAINT `file_entityId_fkey` FOREIGN KEY (`entityId`) REFERENCES `entity`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable: reduce column sizes on entity
ALTER TABLE `entity` MODIFY `rocrateId` VARCHAR(768) NOT NULL,
    MODIFY `name` VARCHAR(512) NOT NULL,
    MODIFY `entityType` VARCHAR(255) NOT NULL,
    MODIFY `memberOf` VARCHAR(768) NULL,
    MODIFY `rootCollection` VARCHAR(768) NULL,
    MODIFY `metadataLicenseId` VARCHAR(255) NOT NULL,
    MODIFY `contentLicenseId` VARCHAR(255) NOT NULL;

-- AlterTable: reduce column sizes on file, add entityId
ALTER TABLE `file` MODIFY `fileId` VARCHAR(768) NOT NULL;

-- Populate entityId from entity.fileId before making it required
ALTER TABLE `file` ADD COLUMN `entityId` VARCHAR(768) NULL;

UPDATE `file`
INNER JOIN `entity` ON `entity`.`fileId` = `file`.`fileId`
SET `file`.`entityId` = `entity`.`rocrateId`;

ALTER TABLE `file` MODIFY `entityId` VARCHAR(768) NOT NULL;

-- DropColumn: remove duplicated fields from file
ALTER TABLE `file` DROP COLUMN `contentLicenseId`,
    DROP COLUMN `memberOf`,
    DROP COLUMN `rootCollection`;

-- DropColumn: remove fileId from entity
ALTER TABLE `entity` DROP COLUMN `fileId`;

-- CreateIndex: unique constraint on entity.rocrateId
CREATE UNIQUE INDEX `entity_rocrateId_key` ON `entity`(`rocrateId`);

-- CreateIndex: indexes on entity
CREATE INDEX `entity_memberOf_idx` ON `entity`(`memberOf`);
CREATE INDEX `entity_rootCollection_idx` ON `entity`(`rootCollection`);
CREATE INDEX `entity_entityType_idx` ON `entity`(`entityType`);

-- DropIndex: old prefix-based unique index on file.fileId
DROP INDEX `File_fileId_key` ON `file`;

-- CreateIndex: unique constraints on file
CREATE UNIQUE INDEX `file_fileId_key` ON `file`(`fileId`);
CREATE UNIQUE INDEX `file_entityId_key` ON `file`(`entityId`);

-- AddForeignKey
ALTER TABLE `file` ADD CONSTRAINT `file_entityId_fkey` FOREIGN KEY (`entityId`) REFERENCES `entity`(`rocrateId`) ON DELETE RESTRICT ON UPDATE CASCADE;

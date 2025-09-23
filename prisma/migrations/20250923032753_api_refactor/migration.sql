/*
  Phased migration to preserve data while renaming and remapping fields:
  1. Add new columns with defaults
  2. Copy and transform data from old columns to new ones
  3. Drop old columns
  4. Remove defaults from new columns where appropriate
*/

-- Step 1: Add new columns with temporary defaults
ALTER TABLE `Entity`
    ADD COLUMN `entityType` ENUM('http://pcdm.org/models#Collection', 'http://pcdm.org/models#Object', 'http://schema.org/MediaObject', 'http://schema.org/Person') NOT NULL DEFAULT 'http://pcdm.org/models#Collection',
    ADD COLUMN `rootCollection` VARCHAR(2048) NULL,
    ADD COLUMN `metadataLicenseId` VARCHAR(2048) NOT NULL DEFAULT 'FIXME',
    ADD COLUMN `contentLicenseId` VARCHAR(2048) NOT NULL DEFAULT 'FIXME';

-- Step 2: Copy and transform data from old columns
-- Map conformsTo URLs to new entityType enum values
UPDATE `Entity` SET `entityType` =
    CASE
        WHEN `conformsTo` LIKE '%Collection%' THEN 'http://pcdm.org/models#Collection'
        WHEN `conformsTo` LIKE '%Object%' THEN 'http://pcdm.org/models#Object'
        WHEN `conformsTo` LIKE '%File%' THEN 'http://schema.org/MediaObject'
        ELSE 'http://pcdm.org/models#Person' -- Default fallback
    END;

-- Copy root to rootCollection
UPDATE `Entity` SET `rootCollection` = `root`;

-- Step 3: Drop old columns
ALTER TABLE `Entity`
    DROP COLUMN `conformsTo`,
    DROP COLUMN `recordType`,
    DROP COLUMN `root`;

-- Step 4: Remove temporary default from entityType (keep defaults for license fields)
ALTER TABLE `Entity`
    ALTER COLUMN `entityType` DROP DEFAULT,
    ALTER COLUMN `metadataLicenseId` DROP DEFAULT,
    ALTER COLUMN `contentLicenseId` DROP DEFAULT;

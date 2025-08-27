/*
  Warnings:

  - You are about to alter the column `recordType` on the `Entity` table. The data in that column could be lost. The data in that column will be cast from `Json` to `Enum(EnumId(0))`.
  - Made the column `rocrate` on table `Entity` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `Entity` MODIFY `recordType` ENUM('RepositoryCollection', 'RepositoryObject') NOT NULL,
    MODIFY `rocrate` JSON NOT NULL;

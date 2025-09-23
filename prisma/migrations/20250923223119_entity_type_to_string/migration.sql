/*
  Warnings:

  - You are about to alter the column `entityType` on the `Entity` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(0))` to `VarChar(1024)`.

*/
-- AlterTable
ALTER TABLE `Entity` MODIFY `entityType` VARCHAR(1024) NOT NULL;

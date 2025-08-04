/*
  Warnings:

  - Added the required column `recordType` to the `Entity` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Entity` ADD COLUMN `recordType` JSON NOT NULL;

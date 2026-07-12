/*
  Warnings:

  - You are about to drop the column `icon` on the `Folder` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "folder"."Folder" DROP COLUMN "icon",
ADD COLUMN     "color" TEXT;

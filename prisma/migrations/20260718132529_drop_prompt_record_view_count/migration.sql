/*
  Warnings:

  - You are about to drop the column `view_count` on the `PromptRecord` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "prompt"."PromptRecord" DROP COLUMN "view_count";

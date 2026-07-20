/*
  Warnings:

  - You are about to drop the column `source_record_id` on the `PromptRecord` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "prompt"."PromptRecord" DROP COLUMN "source_record_id";

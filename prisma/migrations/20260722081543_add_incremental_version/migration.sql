/*
  Warnings:

  - You are about to drop the column `content` on the `PromptRecordVersion` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `PromptRecordVersion` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "prompt"."PromptRecordVersion_record_id_idx";

-- AlterTable
ALTER TABLE "prompt"."PromptRecordVersion" DROP COLUMN "content",
DROP COLUMN "name",
ADD COLUMN     "diff" TEXT,
ADD COLUMN     "is_snapshot" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "snapshot" TEXT;

-- CreateIndex
CREATE INDEX "PromptRecordVersion_record_id_version_number_idx" ON "prompt"."PromptRecordVersion"("record_id", "version_number");

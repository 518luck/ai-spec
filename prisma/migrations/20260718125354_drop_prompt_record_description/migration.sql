/*
  Warnings:

  - You are about to drop the column `description` on the `PromptRecord` table. All the data in the column will be lost.
  - Made the column `color` on table `Folder` required. This step will fail if there are existing NULL values in that column.
  - Made the column `name` on table `PromptDraft` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "folder"."Folder" ALTER COLUMN "color" SET NOT NULL,
ALTER COLUMN "color" SET DEFAULT '#ef4444';

-- AlterTable
ALTER TABLE "prompt"."PromptDraft" ALTER COLUMN "name" SET NOT NULL;

-- AlterTable
ALTER TABLE "prompt"."PromptRecord" DROP COLUMN "description";

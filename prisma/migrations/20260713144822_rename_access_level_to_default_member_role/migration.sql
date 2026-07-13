/*
  Warnings:

  - You are about to drop the column `access_level` on the `Folder` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `PromptDraft` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "folder"."Folder" DROP COLUMN "access_level",
ADD COLUMN     "default_member_role" "folder"."FolderMemberRole" NOT NULL DEFAULT 'viewer';

-- AlterTable
ALTER TABLE "prompt"."PromptDraft" DROP COLUMN "description";

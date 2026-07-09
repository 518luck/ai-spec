/*
  Warnings:

  - You are about to drop the column `workspace_id` on the `PromptRecord` table. All the data in the column will be lost.

*/
-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "folder";

-- CreateEnum
CREATE TYPE "folder"."FolderMemberRole" AS ENUM ('editor', 'viewer', 'none');

-- DropIndex
DROP INDEX "prompt"."PromptRecord_workspace_id_idx";

-- AlterTable
ALTER TABLE "prompt"."PromptDraft" ADD COLUMN     "folder_id" TEXT;

-- AlterTable
ALTER TABLE "prompt"."PromptRecord" DROP COLUMN "workspace_id",
ADD COLUMN     "folder_id" TEXT,
ADD COLUMN     "team_id" TEXT;

-- CreateTable
CREATE TABLE "folder"."Folder" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "team_id" TEXT,
    "access_level" "folder"."FolderMemberRole" NOT NULL DEFAULT 'viewer',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "owner_id" TEXT NOT NULL,

    CONSTRAINT "Folder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "folder"."FolderMember" (
    "id" TEXT NOT NULL,
    "role" "folder"."FolderMemberRole" NOT NULL DEFAULT 'viewer',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "folder_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "FolderMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Folder_owner_id_idx" ON "folder"."Folder"("owner_id");

-- CreateIndex
CREATE INDEX "Folder_team_id_idx" ON "folder"."Folder"("team_id");

-- CreateIndex
CREATE INDEX "FolderMember_user_id_idx" ON "folder"."FolderMember"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "FolderMember_folder_id_user_id_key" ON "folder"."FolderMember"("folder_id", "user_id");

-- CreateIndex
CREATE INDEX "PromptDraft_folder_id_idx" ON "prompt"."PromptDraft"("folder_id");

-- CreateIndex
CREATE INDEX "PromptRecord_team_id_idx" ON "prompt"."PromptRecord"("team_id");

-- CreateIndex
CREATE INDEX "PromptRecord_folder_id_idx" ON "prompt"."PromptRecord"("folder_id");

-- AddForeignKey
ALTER TABLE "folder"."Folder" ADD CONSTRAINT "Folder_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "folder"."Folder" ADD CONSTRAINT "Folder_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "auth"."Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "folder"."FolderMember" ADD CONSTRAINT "FolderMember_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "folder"."Folder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "folder"."FolderMember" ADD CONSTRAINT "FolderMember_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prompt"."PromptRecord" ADD CONSTRAINT "PromptRecord_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "folder"."Folder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prompt"."PromptRecord" ADD CONSTRAINT "PromptRecord_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "auth"."Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prompt"."PromptDraft" ADD CONSTRAINT "PromptDraft_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "folder"."Folder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

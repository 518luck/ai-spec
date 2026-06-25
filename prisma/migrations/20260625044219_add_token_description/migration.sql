/*
  Warnings:

  - You are about to drop the column `createdAt` on the `Token` table. All the data in the column will be lost.
  - You are about to drop the column `lastUsed` on the `Token` table. All the data in the column will be lost.
  - You are about to drop the column `partialKey` on the `Token` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Token` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Token` table. All the data in the column will be lost.
  - Added the required column `partial_key` to the `Token` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `Token` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `Token` table without a default value. This is not possible if the table is not empty.

*/
-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "prompt";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "shared";

-- CreateEnum
CREATE TYPE "prompt"."Visibility" AS ENUM ('private', 'public');

-- DropForeignKey
ALTER TABLE "token"."Token" DROP CONSTRAINT "Token_userId_fkey";

-- DropIndex
DROP INDEX "token"."Token_userId_idx";

-- AlterTable
ALTER TABLE "token"."Token" DROP COLUMN "createdAt",
DROP COLUMN "lastUsed",
DROP COLUMN "partialKey",
DROP COLUMN "updatedAt",
DROP COLUMN "userId",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "last_used" TIMESTAMP(3),
ADD COLUMN     "partial_key" TEXT NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "user_id" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "prompt"."PromptRecord" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "content" TEXT NOT NULL,
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "visibility" "prompt"."Visibility" NOT NULL DEFAULT 'private',
    "workspace_id" TEXT,
    "source_record_id" TEXT,
    "use_count" INTEGER NOT NULL DEFAULT 0,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "owner_id" TEXT NOT NULL,
    "last_editor_id" TEXT,

    CONSTRAINT "PromptRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prompt"."PromptRecordVersion" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "version_number" INTEGER NOT NULL,
    "message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "record_id" TEXT NOT NULL,
    "editor_id" TEXT NOT NULL,

    CONSTRAINT "PromptRecordVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prompt"."PromptDraft" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "content" TEXT NOT NULL,
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "owner_id" TEXT NOT NULL,

    CONSTRAINT "PromptDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prompt"."PromptRecordTag" (
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "record_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,

    CONSTRAINT "PromptRecordTag_pkey" PRIMARY KEY ("record_id","tag_id")
);

-- CreateTable
CREATE TABLE "prompt"."PromptFavorite" (
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" TEXT NOT NULL,
    "record_id" TEXT NOT NULL,

    CONSTRAINT "PromptFavorite_pkey" PRIMARY KEY ("user_id","record_id")
);

-- CreateTable
CREATE TABLE "shared"."Tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PromptRecord_owner_id_idx" ON "prompt"."PromptRecord"("owner_id");

-- CreateIndex
CREATE INDEX "PromptRecord_workspace_id_idx" ON "prompt"."PromptRecord"("workspace_id");

-- CreateIndex
CREATE INDEX "PromptRecord_visibility_idx" ON "prompt"."PromptRecord"("visibility");

-- CreateIndex
CREATE INDEX "PromptRecord_updated_at_idx" ON "prompt"."PromptRecord"("updated_at");

-- CreateIndex
CREATE INDEX "PromptRecordVersion_record_id_idx" ON "prompt"."PromptRecordVersion"("record_id");

-- CreateIndex
CREATE INDEX "PromptDraft_owner_id_idx" ON "prompt"."PromptDraft"("owner_id");

-- CreateIndex
CREATE INDEX "PromptRecordTag_tag_id_idx" ON "prompt"."PromptRecordTag"("tag_id");

-- CreateIndex
CREATE INDEX "PromptFavorite_record_id_idx" ON "prompt"."PromptFavorite"("record_id");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "shared"."Tag"("name");

-- CreateIndex
CREATE INDEX "Token_user_id_idx" ON "token"."Token"("user_id");

-- AddForeignKey
ALTER TABLE "prompt"."PromptRecord" ADD CONSTRAINT "PromptRecord_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prompt"."PromptRecord" ADD CONSTRAINT "PromptRecord_last_editor_id_fkey" FOREIGN KEY ("last_editor_id") REFERENCES "auth"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prompt"."PromptRecordVersion" ADD CONSTRAINT "PromptRecordVersion_record_id_fkey" FOREIGN KEY ("record_id") REFERENCES "prompt"."PromptRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prompt"."PromptRecordVersion" ADD CONSTRAINT "PromptRecordVersion_editor_id_fkey" FOREIGN KEY ("editor_id") REFERENCES "auth"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prompt"."PromptDraft" ADD CONSTRAINT "PromptDraft_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prompt"."PromptRecordTag" ADD CONSTRAINT "PromptRecordTag_record_id_fkey" FOREIGN KEY ("record_id") REFERENCES "prompt"."PromptRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prompt"."PromptRecordTag" ADD CONSTRAINT "PromptRecordTag_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "shared"."Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prompt"."PromptFavorite" ADD CONSTRAINT "PromptFavorite_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prompt"."PromptFavorite" ADD CONSTRAINT "PromptFavorite_record_id_fkey" FOREIGN KEY ("record_id") REFERENCES "prompt"."PromptRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "token"."Token" ADD CONSTRAINT "Token_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

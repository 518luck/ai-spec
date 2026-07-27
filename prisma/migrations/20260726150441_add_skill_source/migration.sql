-- CreateEnum
CREATE TYPE "skill"."SkillSourceKind" AS ENUM ('awesome', 'repo');

-- CreateEnum
CREATE TYPE "skill"."SkillSourceStatus" AS ENUM ('active', 'dormant');

-- AlterTable
ALTER TABLE "skill"."Skill" ADD COLUMN     "delisted_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "skill"."SkillSource" (
    "id" TEXT NOT NULL,
    "repo" TEXT NOT NULL,
    "kind" "skill"."SkillSourceKind" NOT NULL,
    "added_from" TEXT,
    "last_commit_sha" TEXT,
    "etag" TEXT,
    "fail_count" INTEGER NOT NULL DEFAULT 0,
    "status" "skill"."SkillSourceStatus" NOT NULL DEFAULT 'active',
    "last_synced_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SkillSource_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SkillSource_repo_key" ON "skill"."SkillSource"("repo");

-- CreateIndex
CREATE INDEX "SkillSource_status_kind_idx" ON "skill"."SkillSource"("status", "kind");

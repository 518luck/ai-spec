-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "agents";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "skill";

-- CreateEnum
CREATE TYPE "skill"."SkillOrigin" AS ENUM ('github', 'user');

-- CreateTable
CREATE TABLE "agents"."AgentsProject" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "repo_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "owner_id" TEXT NOT NULL,
    "team_id" TEXT,

    CONSTRAINT "AgentsProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agents"."AgentsDoc" (
    "id" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "owner_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,

    CONSTRAINT "AgentsDoc_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill"."Skill" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "content" TEXT,
    "origin" "skill"."SkillOrigin" NOT NULL DEFAULT 'github',
    "license" TEXT,
    "source_repo" TEXT,
    "source_path" TEXT,
    "source_url" TEXT,
    "author_name" TEXT,
    "stars" INTEGER NOT NULL DEFAULT 0,
    "commit_sha" TEXT,
    "last_seen_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "owner_id" TEXT,

    CONSTRAINT "Skill_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AgentsProject_owner_id_idx" ON "agents"."AgentsProject"("owner_id");

-- CreateIndex
CREATE INDEX "AgentsProject_team_id_idx" ON "agents"."AgentsProject"("team_id");

-- CreateIndex
CREATE INDEX "AgentsDoc_owner_id_idx" ON "agents"."AgentsDoc"("owner_id");

-- CreateIndex
CREATE UNIQUE INDEX "AgentsDoc_project_id_path_key" ON "agents"."AgentsDoc"("project_id", "path");

-- CreateIndex
CREATE INDEX "Skill_owner_id_idx" ON "skill"."Skill"("owner_id");

-- CreateIndex
CREATE INDEX "Skill_origin_stars_idx" ON "skill"."Skill"("origin", "stars");

-- CreateIndex
CREATE UNIQUE INDEX "Skill_source_repo_source_path_key" ON "skill"."Skill"("source_repo", "source_path");

-- AddForeignKey
ALTER TABLE "agents"."AgentsProject" ADD CONSTRAINT "AgentsProject_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agents"."AgentsProject" ADD CONSTRAINT "AgentsProject_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "team"."Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agents"."AgentsDoc" ADD CONSTRAINT "AgentsDoc_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agents"."AgentsDoc" ADD CONSTRAINT "AgentsDoc_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "agents"."AgentsProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill"."Skill" ADD CONSTRAINT "Skill_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

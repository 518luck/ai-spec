/*
  Warnings:

  - You are about to drop the `AgentsDoc` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `AgentsProject` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "agents"."AgentsDoc" DROP CONSTRAINT "AgentsDoc_owner_id_fkey";

-- DropForeignKey
ALTER TABLE "agents"."AgentsDoc" DROP CONSTRAINT "AgentsDoc_project_id_fkey";

-- DropForeignKey
ALTER TABLE "agents"."AgentsProject" DROP CONSTRAINT "AgentsProject_owner_id_fkey";

-- DropForeignKey
ALTER TABLE "agents"."AgentsProject" DROP CONSTRAINT "AgentsProject_team_id_fkey";

-- DropTable
DROP TABLE "agents"."AgentsDoc";

-- DropTable
DROP TABLE "agents"."AgentsProject";

-- CreateTable
CREATE TABLE "agents"."Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "repo_url" TEXT,
    "folder_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "owner_id" TEXT NOT NULL,
    "team_id" TEXT,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agents"."AgentsMd" (
    "id" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "owner_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,

    CONSTRAINT "AgentsMd_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Project_owner_id_idx" ON "agents"."Project"("owner_id");

-- CreateIndex
CREATE INDEX "Project_team_id_idx" ON "agents"."Project"("team_id");

-- CreateIndex
CREATE INDEX "Project_folder_id_idx" ON "agents"."Project"("folder_id");

-- CreateIndex
CREATE INDEX "AgentsMd_owner_id_idx" ON "agents"."AgentsMd"("owner_id");

-- CreateIndex
CREATE UNIQUE INDEX "AgentsMd_project_id_path_key" ON "agents"."AgentsMd"("project_id", "path");

-- AddForeignKey
ALTER TABLE "agents"."Project" ADD CONSTRAINT "Project_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agents"."Project" ADD CONSTRAINT "Project_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "team"."Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agents"."Project" ADD CONSTRAINT "Project_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "folder"."Folder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agents"."AgentsMd" ADD CONSTRAINT "AgentsMd_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agents"."AgentsMd" ADD CONSTRAINT "AgentsMd_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "agents"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

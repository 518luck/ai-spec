/*
  Warnings:

  - You are about to drop the `ProjectFolder` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "agents_md"."ProjectFolder" DROP CONSTRAINT "ProjectFolder_owner_id_fkey";

-- DropForeignKey
ALTER TABLE "agents_md"."ProjectFolder" DROP CONSTRAINT "ProjectFolder_project_id_fkey";

-- DropTable
DROP TABLE "agents_md"."ProjectFolder";

-- CreateTable
CREATE TABLE "project"."ProjectFolder" (
    "id" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "owner_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,

    CONSTRAINT "ProjectFolder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProjectFolder_owner_id_idx" ON "project"."ProjectFolder"("owner_id");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectFolder_project_id_path_key" ON "project"."ProjectFolder"("project_id", "path");

-- AddForeignKey
ALTER TABLE "project"."ProjectFolder" ADD CONSTRAINT "ProjectFolder_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project"."ProjectFolder" ADD CONSTRAINT "ProjectFolder_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "project"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

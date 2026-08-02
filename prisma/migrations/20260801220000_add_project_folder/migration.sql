-- CreateTable
CREATE TABLE "agents_md"."ProjectFolder" (
    "id" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "owner_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,

    CONSTRAINT "ProjectFolder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProjectFolder_owner_id_idx" ON "agents_md"."ProjectFolder"("owner_id");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectFolder_project_id_path_key" ON "agents_md"."ProjectFolder"("project_id", "path");

-- AddForeignKey
ALTER TABLE "agents_md"."ProjectFolder" ADD CONSTRAINT "ProjectFolder_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agents_md"."ProjectFolder" ADD CONSTRAINT "ProjectFolder_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "project"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

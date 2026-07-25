-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "rule";

-- AlterTable
ALTER TABLE "folder"."Folder" ADD COLUMN     "rule_space_id" TEXT;

-- CreateTable
CREATE TABLE "rule"."RuleSpace" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "owner_id" TEXT NOT NULL,
    "team_id" TEXT,

    CONSTRAINT "RuleSpace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rule"."Rule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "owner_id" TEXT NOT NULL,
    "space_id" TEXT NOT NULL,
    "folder_id" TEXT,

    CONSTRAINT "Rule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rule"."RuleTag" (
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rule_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,

    CONSTRAINT "RuleTag_pkey" PRIMARY KEY ("rule_id","tag_id")
);

-- CreateIndex
CREATE INDEX "RuleSpace_owner_id_idx" ON "rule"."RuleSpace"("owner_id");

-- CreateIndex
CREATE INDEX "RuleSpace_team_id_idx" ON "rule"."RuleSpace"("team_id");

-- CreateIndex
CREATE INDEX "Rule_owner_id_idx" ON "rule"."Rule"("owner_id");

-- CreateIndex
CREATE INDEX "Rule_space_id_idx" ON "rule"."Rule"("space_id");

-- CreateIndex
CREATE INDEX "Rule_folder_id_idx" ON "rule"."Rule"("folder_id");

-- CreateIndex
CREATE INDEX "RuleTag_tag_id_idx" ON "rule"."RuleTag"("tag_id");

-- CreateIndex
CREATE INDEX "Folder_rule_space_id_idx" ON "folder"."Folder"("rule_space_id");

-- AddForeignKey
ALTER TABLE "folder"."Folder" ADD CONSTRAINT "Folder_rule_space_id_fkey" FOREIGN KEY ("rule_space_id") REFERENCES "rule"."RuleSpace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rule"."RuleSpace" ADD CONSTRAINT "RuleSpace_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rule"."RuleSpace" ADD CONSTRAINT "RuleSpace_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "team"."Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rule"."Rule" ADD CONSTRAINT "Rule_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rule"."Rule" ADD CONSTRAINT "Rule_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "rule"."RuleSpace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rule"."Rule" ADD CONSTRAINT "Rule_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "folder"."Folder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rule"."RuleTag" ADD CONSTRAINT "RuleTag_rule_id_fkey" FOREIGN KEY ("rule_id") REFERENCES "rule"."Rule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rule"."RuleTag" ADD CONSTRAINT "RuleTag_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "shared"."Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

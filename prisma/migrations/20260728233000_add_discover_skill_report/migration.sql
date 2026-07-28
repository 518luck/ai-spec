-- CreateEnum
CREATE TYPE "discover"."DiscoverSkillReportReason" AS ENUM ('lowQuality', 'inappropriate', 'spam', 'licenseIssue', 'other');

-- CreateEnum
CREATE TYPE "discover"."DiscoverSkillReportStatus" AS ENUM ('open', 'reviewed', 'dismissed');

-- CreateTable
CREATE TABLE "discover"."DiscoverSkillReport" (
    "id" TEXT NOT NULL,
    "reason" "discover"."DiscoverSkillReportReason" NOT NULL,
    "detail" TEXT,
    "status" "discover"."DiscoverSkillReportStatus" NOT NULL DEFAULT 'open',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "skill_id" TEXT NOT NULL,
    "reporter_id" TEXT NOT NULL,

    CONSTRAINT "DiscoverSkillReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DiscoverSkillReport_status_created_at_idx" ON "discover"."DiscoverSkillReport"("status", "created_at");

-- CreateIndex
CREATE INDEX "DiscoverSkillReport_skill_id_idx" ON "discover"."DiscoverSkillReport"("skill_id");

-- CreateIndex
CREATE UNIQUE INDEX "DiscoverSkillReport_skill_id_reporter_id_key" ON "discover"."DiscoverSkillReport"("skill_id", "reporter_id");

-- AddForeignKey
ALTER TABLE "discover"."DiscoverSkillReport" ADD CONSTRAINT "DiscoverSkillReport_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "discover"."DiscoverSkill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discover"."DiscoverSkillReport" ADD CONSTRAINT "DiscoverSkillReport_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "auth"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

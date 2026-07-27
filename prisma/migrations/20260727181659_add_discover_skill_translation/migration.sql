-- CreateEnum
CREATE TYPE "discover"."TranslationStatus" AS ENUM ('pending', 'done', 'skipped', 'failed');

-- AlterTable
ALTER TABLE "discover"."DiscoverSkill" ADD COLUMN     "description_hash" TEXT,
ADD COLUMN     "description_zh" TEXT,
ADD COLUMN     "translation_status" "discover"."TranslationStatus" NOT NULL DEFAULT 'pending';

-- CreateIndex
CREATE INDEX "DiscoverSkill_translation_status_stars_idx" ON "discover"."DiscoverSkill"("translation_status", "stars");

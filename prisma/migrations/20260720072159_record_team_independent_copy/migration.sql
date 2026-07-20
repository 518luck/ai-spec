-- AlterTable
ALTER TABLE "prompt"."PromptRecord" ADD COLUMN     "contributed_by" TEXT,
ALTER COLUMN "owner_id" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "PromptFavorite_user_id_idx" ON "prompt"."PromptFavorite"("user_id");

-- CreateIndex
CREATE INDEX "PromptRecord_contributed_by_idx" ON "prompt"."PromptRecord"("contributed_by");

-- AddForeignKey
ALTER TABLE "prompt"."PromptRecord" ADD CONSTRAINT "PromptRecord_contributed_by_fkey" FOREIGN KEY ("contributed_by") REFERENCES "auth"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

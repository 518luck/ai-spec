-- PromptFavorite 扩展：加 id 主键（原复合主键改为唯一约束）+ teamMemberId 字段
-- TeamFavorite 新建：团队共享收藏（成员共用，与 PromptFavorite 个人收藏独立）

-- AlterTable
ALTER TABLE "prompt"."PromptFavorite" DROP CONSTRAINT "PromptFavorite_pkey",
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "team_member_id" TEXT,
ADD CONSTRAINT "PromptFavorite_pkey" PRIMARY KEY ("id");

-- CreateTable
CREATE TABLE "prompt"."TeamFavorite" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "team_id" TEXT NOT NULL,
    "record_id" TEXT NOT NULL,
    "added_by_id" TEXT,

    CONSTRAINT "TeamFavorite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TeamFavorite_team_id_idx" ON "prompt"."TeamFavorite"("team_id");

-- CreateIndex
CREATE INDEX "TeamFavorite_record_id_idx" ON "prompt"."TeamFavorite"("record_id");

-- CreateIndex
CREATE UNIQUE INDEX "TeamFavorite_team_id_record_id_key" ON "prompt"."TeamFavorite"("team_id", "record_id");

-- CreateIndex
CREATE INDEX "PromptFavorite_team_member_id_idx" ON "prompt"."PromptFavorite"("team_member_id");

-- CreateIndex
CREATE UNIQUE INDEX "PromptFavorite_user_id_record_id_team_member_id_key" ON "prompt"."PromptFavorite"("user_id", "record_id", "team_member_id");

-- AddForeignKey
ALTER TABLE "prompt"."PromptFavorite" ADD CONSTRAINT "PromptFavorite_team_member_id_fkey" FOREIGN KEY ("team_member_id") REFERENCES "team"."TeamMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prompt"."TeamFavorite" ADD CONSTRAINT "TeamFavorite_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "team"."Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prompt"."TeamFavorite" ADD CONSTRAINT "TeamFavorite_record_id_fkey" FOREIGN KEY ("record_id") REFERENCES "prompt"."PromptRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prompt"."TeamFavorite" ADD CONSTRAINT "TeamFavorite_added_by_id_fkey" FOREIGN KEY ("added_by_id") REFERENCES "auth"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

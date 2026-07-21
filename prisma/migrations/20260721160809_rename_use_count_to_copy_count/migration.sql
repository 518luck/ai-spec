-- PromptRecord: use_count → copy_count（列重命名，保留现有 250 条计数数据）
-- ! 用 RENAME COLUMN 而不是 drop+add，保留历史计数数据
-- ! Prisma 无法自动识别列重命名，会生成 drop+add 的破坏性 SQL，这里手工写 RENAME 规避

-- 列重命名
ALTER TABLE "prompt"."PromptRecord" RENAME COLUMN "use_count" TO "copy_count";

-- 索引重建（先删旧索引，再用新列名建同名约定的新索引；IF EXISTS 兼容命名差异）
DROP INDEX IF EXISTS "prompt"."PromptRecord_use_count_idx";
CREATE INDEX "PromptRecord_copy_count_idx" ON "prompt"."PromptRecord"("copy_count");

-- PromptRecord: 新增 last_copied_at 列，驱动 HN 幂律热度排序的时间衰减项
-- ! 可空：copy_count=0（从未复制过）的记录 last_copied_at 保持 NULL，排序时 NULLS LAST 自动沉底
ALTER TABLE "prompt"."PromptRecord" ADD COLUMN "last_copied_at" TIMESTAMP(3);

-- 热度查询辅助索引：last_copied_at 单字段索引，加速"最近复制"类查询
CREATE INDEX "PromptRecord_last_copied_at_idx" ON "prompt"."PromptRecord"("last_copied_at");

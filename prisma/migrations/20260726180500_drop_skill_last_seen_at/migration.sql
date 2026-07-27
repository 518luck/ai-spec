-- 删除只写不读的诊断字段 last_seen_at（sweep 已改为按货源状态判定下架，时间窗方案废弃）
ALTER TABLE "discover"."DiscoverSkill" DROP COLUMN "last_seen_at";

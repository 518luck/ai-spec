-- 将团队相关表从 auth schema 迁移到独立的 team schema（数据保留，用跨 schema 移动而非 drop/create）

-- 1. 创建 team schema
CREATE SCHEMA IF NOT EXISTS "team";

-- 2. 把 Team/TeamMember 表从 auth 移到 team schema（数据保留，PostgreSQL 的 ALTER TABLE SET SCHEMA 是元数据操作，瞬间完成不丢数据）
ALTER TABLE "auth"."Team" SET SCHEMA "team";
ALTER TABLE "auth"."TeamMember" SET SCHEMA "team";

-- 3. 枚举类型也要移动：先在 team 重建，再用 ALTER TYPE 移动
--    PostgreSQL 的 ALTER TYPE ... SET SCHEMA 同样是元数据操作
ALTER TYPE "auth"."TeamPlan" SET SCHEMA "team";
ALTER TYPE "auth"."TeamRole" SET SCHEMA "team";

-- 4. 重建跨 schema 的外键（TeamMember.user_id 现在是 team→auth 的跨域外键）
--    原有外键在 SET SCHEMA 时会被保留，但指向关系可能需要刷新，这里先删后建确保正确
ALTER TABLE "team"."TeamMember" DROP CONSTRAINT IF EXISTS "TeamMember_team_id_fkey";
ALTER TABLE "team"."TeamMember" DROP CONSTRAINT IF EXISTS "TeamMember_user_id_fkey";

ALTER TABLE "team"."TeamMember" ADD CONSTRAINT "TeamMember_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "team"."Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "team"."TeamMember" ADD CONSTRAINT "TeamMember_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

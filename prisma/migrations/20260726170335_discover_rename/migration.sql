-- Skills 域整体迁移到 Discover 域：schema/表/enum 全部 RENAME 原地保留数据，
-- 并删除为"用户自建 skill"预留的 origin/owner_id 字段（该功能将来在个人空间域独立建表）。
-- ! 手写迁移：Prisma 对 schema 改名默认生成 DROP+CREATE（丢数据），此处必须用 ALTER ... RENAME。

-- ① schema 与表改名
ALTER SCHEMA "skill" RENAME TO "discover";
ALTER TABLE "discover"."Skill" RENAME TO "DiscoverSkill";
ALTER TABLE "discover"."SkillSource" RENAME TO "DiscoverSource";

-- ② 删除用户自建预留字段（先删依赖的外键/索引，再删列，最后删枚举类型）
ALTER TABLE "discover"."DiscoverSkill" DROP CONSTRAINT "Skill_owner_id_fkey";
DROP INDEX "discover"."Skill_owner_id_idx";
ALTER TABLE "discover"."DiscoverSkill" DROP COLUMN "owner_id";
DROP INDEX "discover"."Skill_origin_stars_idx";
ALTER TABLE "discover"."DiscoverSkill" DROP COLUMN "origin";
DROP TYPE "discover"."SkillOrigin";

-- ③ 广场条目必有来源仓库与路径（预检确认存量无 null）
ALTER TABLE "discover"."DiscoverSkill" ALTER COLUMN "source_repo" SET NOT NULL;
ALTER TABLE "discover"."DiscoverSkill" ALTER COLUMN "source_path" SET NOT NULL;

-- ④ 枚举类型改名
ALTER TYPE "discover"."SkillSourceKind" RENAME TO "DiscoverSourceKind";
ALTER TYPE "discover"."SkillSourceStatus" RENAME TO "DiscoverSourceStatus";

-- ⑤ 约束与索引名对齐 Prisma 命名约定（RENAME CONSTRAINT 会连带改名底层索引）
ALTER TABLE "discover"."DiscoverSkill" RENAME CONSTRAINT "Skill_pkey" TO "DiscoverSkill_pkey";
ALTER INDEX "discover"."Skill_source_repo_source_path_key" RENAME TO "DiscoverSkill_source_repo_source_path_key";
CREATE INDEX "DiscoverSkill_stars_idx" ON "discover"."DiscoverSkill"("stars");
ALTER TABLE "discover"."DiscoverSource" RENAME CONSTRAINT "SkillSource_pkey" TO "DiscoverSource_pkey";
ALTER INDEX "discover"."SkillSource_repo_key" RENAME TO "DiscoverSource_repo_key";
ALTER INDEX "discover"."SkillSource_status_kind_idx" RENAME TO "DiscoverSource_status_kind_idx";

-- ⑥ 已发 API Key 的存量权限字符串同步（skills.* → discover.*）
UPDATE "token"."Token"
SET scopes = replace(replace(scopes, 'skills.read', 'discover.read'), 'skills.write', 'discover.write')
WHERE scopes LIKE '%skills.%';

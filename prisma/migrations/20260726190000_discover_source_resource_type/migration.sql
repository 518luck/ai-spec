-- 货源表升级为多资源类型公共表：加 resource_type 判别列（存量回填 'skills'），
-- 唯一键 repo → (repo, resource_type)，索引扩为含资源类型前缀。

ALTER TABLE "discover"."DiscoverSource" ADD COLUMN "resource_type" TEXT NOT NULL DEFAULT 'skills';
-- 回填完成后去掉默认值，与 schema "强制显式传入" 约定一致
ALTER TABLE "discover"."DiscoverSource" ALTER COLUMN "resource_type" DROP DEFAULT;

DROP INDEX "discover"."DiscoverSource_repo_key";
CREATE UNIQUE INDEX "DiscoverSource_repo_resource_type_key" ON "discover"."DiscoverSource"("repo", "resource_type");

DROP INDEX "discover"."DiscoverSource_status_kind_idx";
CREATE INDEX "DiscoverSource_resource_type_status_kind_idx" ON "discover"."DiscoverSource"("resource_type", "status", "kind");

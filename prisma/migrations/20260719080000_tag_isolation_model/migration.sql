-- Tag 表从全局共享字典改造为按"用户 + 团队 + 资源类型"三维隔离（对齐 Folder）
-- 1. 去掉 name 的全局唯一约束（改成应用层按 ownerId+teamId+resourceType+name 保证唯一）
-- 2. 新增 ownerId / teamId / resourceType 三个字段
-- 3. 加 (owner_id, resource_type, name) 索引（加速 findFirst + 列表查询）
-- 注：Tag 表迁移前为空（测试数据已清空），无需数据迁移

-- DropIndex
DROP INDEX IF EXISTS shared."Tag_name_key";

-- AlterTable
ALTER TABLE shared."Tag" ADD COLUMN "owner_id" TEXT NOT NULL,
ADD COLUMN "resource_type" TEXT NOT NULL,
ADD COLUMN "team_id" TEXT;

-- CreateIndex
CREATE INDEX "Tag_owner_id_resource_type_name_idx" ON shared."Tag"("owner_id", "resource_type", "name");

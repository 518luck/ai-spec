-- # 项目内文件夹去掉创建者：只与项目挂钩（projectId），删除冗余的 owner_id 列/外键/索引

-- DropForeignKey
ALTER TABLE "project"."ProjectFolder" DROP CONSTRAINT "ProjectFolder_owner_id_fkey";

-- DropIndex
DROP INDEX "project"."ProjectFolder_owner_id_idx";

-- AlterTable
ALTER TABLE "project"."ProjectFolder" DROP COLUMN "owner_id";

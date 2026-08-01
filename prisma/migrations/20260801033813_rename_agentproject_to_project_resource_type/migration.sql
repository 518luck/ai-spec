-- 数据迁移：resourceType / scope 字面量从 agentProject 统一为 project（个人/团队通用）

-- 文件夹资源类型：agentProject → project
UPDATE "folder"."Folder" SET "resource_type" = 'project' WHERE "resource_type" = 'agentProject';

-- API Key scope 字符串：把 agentProject.read / agentProject.write 替换为 project.read / project.write
-- scopes 列为空格分隔字符串，用 replace 逐条替换
UPDATE "token"."Token" SET "scopes" = REPLACE("scopes", 'agentProject.read', 'project.read') WHERE "scopes" LIKE '%agentProject.read%';
UPDATE "token"."Token" SET "scopes" = REPLACE("scopes", 'agentProject.write', 'project.write') WHERE "scopes" LIKE '%agentProject.write%';

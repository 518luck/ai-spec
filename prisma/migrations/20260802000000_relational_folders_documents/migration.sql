-- # 文档-文件夹关系重构：path → name + parentId 树 + 多对多中间表
--
-- 顺序：① AgentsMd 加 name 列并填充（path 末段）；② 重建 ProjectFolder（name + parent_id）；
-- ③ 建中间表；④ 每项目补根文件夹；⑤ 用旧 path 前缀物化文件夹层级并挂载文档；⑥ 删 path 列

-- ① AgentsMd：加 name 列并填充（path 保留到物化完成后删除）
ALTER TABLE "agents_md"."AgentsMd" ADD COLUMN "name" TEXT;
UPDATE "agents_md"."AgentsMd" SET "name" = split_part("path", '/', -1);
ALTER TABLE "agents_md"."AgentsMd" ALTER COLUMN "name" SET NOT NULL;
CREATE INDEX "AgentsMd_project_id_idx" ON "agents_md"."AgentsMd"("project_id");

-- ② ProjectFolder 重建：path 结构 → name + parent_id（旧表为空，直接重建）
DROP TABLE "project"."ProjectFolder";
CREATE TABLE "project"."ProjectFolder" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parent_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "owner_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,

    CONSTRAINT "ProjectFolder_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ProjectFolder_owner_id_idx" ON "project"."ProjectFolder"("owner_id");
CREATE INDEX "ProjectFolder_project_id_idx" ON "project"."ProjectFolder"("project_id");
CREATE UNIQUE INDEX "ProjectFolder_project_id_parent_id_name_key" ON "project"."ProjectFolder"("project_id", "parent_id", "name");
ALTER TABLE "project"."ProjectFolder" ADD CONSTRAINT "ProjectFolder_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "project"."ProjectFolder" ADD CONSTRAINT "ProjectFolder_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "project"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "project"."ProjectFolder" ADD CONSTRAINT "ProjectFolder_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "project"."ProjectFolder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ③ 中间表：文档-文件夹 多对多
CREATE TABLE "agents_md"."AgentsMdFolder" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "agents_md_id" TEXT NOT NULL,
    "project_folder_id" TEXT NOT NULL,

    CONSTRAINT "AgentsMdFolder_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "AgentsMdFolder_agents_md_id_project_folder_id_key" ON "agents_md"."AgentsMdFolder"("agents_md_id", "project_folder_id");
CREATE INDEX "AgentsMdFolder_project_folder_id_idx" ON "agents_md"."AgentsMdFolder"("project_folder_id");
ALTER TABLE "agents_md"."AgentsMdFolder" ADD CONSTRAINT "AgentsMdFolder_agents_md_id_fkey" FOREIGN KEY ("agents_md_id") REFERENCES "agents_md"."AgentsMd"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "agents_md"."AgentsMdFolder" ADD CONSTRAINT "AgentsMdFolder_project_folder_id_fkey" FOREIGN KEY ("project_folder_id") REFERENCES "project"."ProjectFolder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ④ 根文件夹：每项目一条（name=项目名，parent_id=NULL），顶层文档/文件夹挂它下面
INSERT INTO "project"."ProjectFolder" ("id", "name", "parent_id", "created_at", "updated_at", "owner_id", "project_id")
SELECT gen_random_uuid()::text, p."name", NULL, now(), now(), p."owner_id", p."id"
FROM "project"."Project" p;

-- ⑤ 物化：按文档旧 path 前缀逐层找/建文件夹，文档挂到最近前缀的文件夹
DO $$
DECLARE
  doc RECORD;
  segs TEXT[];
  seg TEXT;
  depth INT;
  root_id TEXT;
  cur_parent TEXT;
  folder_row TEXT;
BEGIN
  FOR doc IN SELECT "id", "project_id", "owner_id", "path" FROM "agents_md"."AgentsMd" LOOP
    SELECT "id" INTO root_id FROM "project"."ProjectFolder"
      WHERE "project_id" = doc.project_id AND "parent_id" IS NULL;

    segs := string_to_array(doc.path, '/');
    -- 末段是文件名，去掉后逐层物化文件夹前缀
    IF array_length(segs, 1) > 1 THEN
      cur_parent := root_id;
      FOR depth IN 1..(array_length(segs, 1) - 1) LOOP
        seg := segs[depth];
        SELECT "id" INTO folder_row FROM "project"."ProjectFolder"
          WHERE "project_id" = doc.project_id AND "parent_id" = cur_parent AND "name" = seg;
        IF folder_row IS NULL THEN
          INSERT INTO "project"."ProjectFolder" ("id", "name", "parent_id", "created_at", "updated_at", "owner_id", "project_id")
          VALUES (gen_random_uuid()::text, seg, cur_parent, now(), now(), doc.owner_id, doc.project_id)
          RETURNING "id" INTO folder_row;
        END IF;
        cur_parent := folder_row;
      END LOOP;
    ELSE
      -- 顶层文档（path 无前缀）：挂根文件夹
      cur_parent := root_id;
    END IF;

    INSERT INTO "agents_md"."AgentsMdFolder" ("id", "created_at", "agents_md_id", "project_folder_id")
    VALUES (gen_random_uuid()::text, now(), doc.id, cur_parent);
  END LOOP;
END $$;

-- ⑥ 删除已迁移的 path 列
ALTER TABLE "agents_md"."AgentsMd" DROP COLUMN "path";

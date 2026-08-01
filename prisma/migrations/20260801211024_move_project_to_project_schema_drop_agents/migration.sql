-- 把 Project 表从 agents schema 迁移到独立的 project schema，并删除已空的 agents schema
-- （agents 库原本混放 Project + AgentsMd，二者均非"智能体"，命名有歧义；上轮已搬走 AgentsMd，此轮搬走 Project 后清空删除）
-- ! 用 ALTER TABLE ... SET SCHEMA 搬表：保留全部数据与索引，不 drop/recreate

-- 创建目标 schema
CREATE SCHEMA IF NOT EXISTS "project";

-- 把 Project 表搬到新 schema（数据 + 索引一并迁移）
-- Project 的外键（→ auth.User / team.Team / folder.Folder）目标表都在别的 schema，不受影响，约束随表保留
ALTER TABLE "agents"."Project" SET SCHEMA "project";

-- AgentsMd.project_id 外键原本指向 agents.Project，被引用表已搬到 project.Project
-- PostgreSQL 会自动维护跨 schema 引用（约束按表对象绑定，表搬走约束仍有效），此处无需重建

-- agents schema 现已无表（Project、AgentsMd 均已迁出），安全删除
DROP SCHEMA "agents";

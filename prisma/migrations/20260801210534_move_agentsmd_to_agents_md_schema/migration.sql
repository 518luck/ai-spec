-- 把 AgentsMd 表从 agents schema 迁移到独立的 agents_md schema
-- （AGENTS.md 文档与"智能体(agents)"是不同概念，物理上拆库避免命名歧义）
-- ! 用 ALTER TABLE ... SET SCHEMA 搬表：保留全部数据与索引，不 drop/recreate
--   跨 schema 外键（AgentsMd.project_id → agents.Project.id）PostgreSQL 原生支持，约束随表保留

-- 创建目标 schema
CREATE SCHEMA IF NOT EXISTS "agents_md";

-- 把 AgentsMd 表搬到新 schema（数据 + 索引一并迁移，外键约束保留）
ALTER TABLE "agents"."AgentsMd" SET SCHEMA "agents_md";

-- 修复 Token 表与 schema 的三处历史偏差（历次 migration 的遗漏）：
-- 1. hashedkey → hashed_key：建表时列名缺下划线，add_token_description 把其余列改成 snake_case 时漏掉这一列。
-- 2. 新增 scopes：schema 中 Token.scopes 早已定义，但从未有 migration 创建过该列。
-- 3. expires 改为可空：schema 中是 DateTime?（永不过期用 null），建表时为 NOT NULL，后续未放宽。
-- 这些偏差导致 Prisma Client 写入时报 P2022 / 23502（列不存在 / 非空约束违反）。

-- ① 列名对齐 snake_case
ALTER TABLE "token"."Token" RENAME COLUMN "hashedkey" TO "hashed_key";

-- ② 补建权限范围列：空格分隔的 scope 字符串（如 "apis.all"），null 表示无额外权限
ALTER TABLE "token"."Token" ADD COLUMN "scopes" TEXT;

-- ③ 放宽过期时间为可空，null 表示永不过期
ALTER TABLE "token"."Token" ALTER COLUMN "expires" DROP NOT NULL;

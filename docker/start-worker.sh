#!/bin/sh
# 启动后台 Worker（直接调 tsx，不走 pnpm）
# 广场扫描 / 翻译 / 通用队列消费
set -e
exec ./node_modules/.bin/tsx workers/queue/index.ts

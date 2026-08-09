#!/bin/sh
# 启动 Next.js 生产服务器（直接调 next start，不走 pnpm）
set -e
exec ./node_modules/.bin/next start

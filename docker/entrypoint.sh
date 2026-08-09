#!/bin/sh
# 容器统一入口：根据角色执行迁移后启动对应进程
# ! 仅 web 角色执行数据库迁移，避免多副本时并发 migrate 冲突
# ! 直接调用 node_modules/.bin 下的二进制，绕开 corepack/pnpm（运行期不需要包管理器，也避免非 root 用户写 corepack cache 的权限问题）
# 用法：entrypoint.sh web | worker

set -e

ROLE="${1:-web}"

echo "[entrypoint] role=$ROLE"

# 数据库迁移：仅 web 角色执行一次
if [ "$ROLE" = "web" ]; then
	echo "[entrypoint] 开始应用数据库迁移..."
	# 应用所有未执行的迁移（生产用 deploy，不会交互提示）
	./node_modules/.bin/prisma migrate deploy
	echo "[entrypoint] 数据库迁移完成"
fi

# 启动对应角色的进程
case "$ROLE" in
	web)
		echo "[entrypoint] 启动 Next.js 生产服务器..."
		exec ./start-web.sh
		;;
	worker)
		echo "[entrypoint] 启动后台 Worker..."
		exec ./start-worker.sh
		;;
	*)
		echo "[entrypoint] 未知角色: $ROLE（应为 web 或 worker）" >&2
		exit 1
		;;
esac

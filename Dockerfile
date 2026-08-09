# =============================================================================
# 阶段 1：基础镜像与系统依赖
# =============================================================================
# 注：不声明 syntax 行，使用 Docker 内置 BuildKit frontend（支持 --mount=cache）
# 声明外部 syntax 会额外拉取 docker/dockerfile 镜像，国内服务器易超时
# Node 24 LTS（对齐本地 v24.16.0）；alpine 体积小但 Prisma 二进制兼容性差，
# 用 slim 避免 prisma engine / sharp 等原生模块装不上
FROM node:24-slim AS base

# 装 pnpm 11（对齐本地 11.17.0）和 openssl（Prisma 运行时需要）
RUN corepack enable && corepack prepare pnpm@11.17.0 --activate \
	&& apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
	&& rm -rf /var/lib/apt/lists/*

ENV PNPM_HOME=/pnpm
ENV PATH="$PNPM_HOME:$PATH"

# =============================================================================
# 阶段 2：装依赖（利用分层缓存，代码变更不会重装依赖）
# =============================================================================
FROM base AS deps

WORKDIR /app

# 先只拷清单文件，最大化命中缓存
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY prisma ./prisma
COPY prisma.config.ts ./
COPY source.config.ts ./
COPY content ./content

# 装全量依赖（含 devDependencies，构建需要）
# --frozen-lockfile 保证锁文件一致；失败立即报错而不是悄悄改锁
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
	pnpm install --frozen-lockfile

# 生成 Prisma Client（构建期需要类型，运行期也需要 client）
RUN pnpm run prisma:generate

# =============================================================================
# 阶段 3：构建 Next.js 产物
# =============================================================================
FROM deps AS builder

WORKDIR /app

# 拷全部源码（.dockerignore 已排除 node_modules/.next 等）
COPY . .

# 用构建专用环境变量（构建期需要的公开值）
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# ! 构建期占位：src/server/infrastructure/axiom/axiom.ts 在模块加载时无条件
# ! 校验 AXIOM_TOKEN，缺失会导致 next build 在 collect page data 阶段失败。
# ! 这里给个占位值让模块加载通过；运行时由 .env.production 的真实值覆盖，
# ! 且 IS_AXIOM_ENABLED != true 时根本不会真正上报。
ENV AXIOM_TOKEN=build-placeholder
ENV AXIOM_DATASET=build-placeholder

# ! 同理：redis/storage 客户端在校验中抛错，webpack build 的 collect page data
# ! 阶段会触发到。占位值让 build 通过；运行时由 compose 注入的真实值覆盖。
ENV REDIS_URL=redis://build-placeholder:6379
ENV S3_ACCESS_KEY_ID=build-placeholder
ENV S3_SECRET_ACCESS_KEY=build-placeholder
ENV S3_PUBLIC_BUCKET=ai-spec-public
ENV S3_PRIVATE_BUCKET=ai-spec-private
ENV S3_PUBLIC_URL=http://build-placeholder/ai-spec-public
ENV S3_REGION=auto

# next build：fumadocs-mdx postinstall 已在 deps 阶段跑过，这里直接 build
# ! 用 --webpack 而非默认 Turbopack：Next.js 16 Turbopack + zod 4 在 collect
# ! page data 阶段有回归 bug（vercel/next.js#82723），webpack 不受影响。
# ! 等 Next.js 修复后可改回 pnpm run build（默认 Turbopack）。
RUN pnpm exec next build --webpack

# =============================================================================
# 阶段 4：运行期镜像（剪掉 devDependencies）
# =============================================================================
FROM base AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# 创建非 root 用户运行（安全）
RUN groupadd --system --gid 1001 nodejs \
	&& useradd --system --uid 1001 --gid nodejs nextjs

# 从 deps 阶段拿生产依赖（先 prune 再装 prod only）
# —— 这里偷个巧：直接复用 deps 阶段的 node_modules，跳过 prune
# 因为 worker 也需要部分 devDep（tsx）， prune 掉会跑不起来
COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=deps --chown=nextjs:nodejs /app/src/shared/db/generator ./src/shared/db/generator

# 拷构建产物和运行所需源码
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.source ./.source
COPY --from=builder --chown=nextjs:nodejs /app/content ./content

# 拷运行所需配置和入口
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=builder --chown=nextjs:nodejs /app/next.config.ts ./next.config.ts
COPY --from=builder --chown=nextjs:nodejs /app/source.config.ts ./source.config.ts
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder --chown=nextjs:nodejs /app/workers ./workers
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts

# 启动脚本（迁移 + 启动）
COPY --chown=nextjs:nodejs docker/entrypoint.sh ./entrypoint.sh
COPY --chown=nextjs:nodejs docker/start-web.sh ./start-web.sh
COPY --chown=nextjs:nodejs docker/start-worker.sh ./start-worker.sh
RUN chmod +x ./entrypoint.sh ./start-web.sh ./start-worker.sh

# 创建日志目录
RUN mkdir -p logs && chown -R nextjs:nodejs logs

USER nextjs

EXPOSE 3000

# 默认启动 web；worker 通过 compose 覆盖 command
CMD ["./entrypoint.sh", "web"]

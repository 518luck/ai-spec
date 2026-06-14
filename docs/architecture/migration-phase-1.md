# 阶段 1 迁移计划：monorepo 最小骨架

> **状态：未实施**
>
> 本文档是待执行的迁移手册。当基础界面开发完成、准备开始 monorepo 改造时，照此执行。
> 执行完成后请将本文件顶部状态改为「已完成」，并在下方「执行记录」追加日期与 commit hash。
>
> 本计划基于 [ADR-004](./decisions.md#adr-004阶段-1-走最小骨架不抽-packages) 和 [ADR-006](./decisions.md#adr-006worker-阶段-1-留在-web-内不独立成包)。
> 完整背景与目标架构见 [overview.md](./overview.md)。

## 目标

把整个 Next.js 项目整体平移进 `apps/web/`，引入 `pnpm-workspace.yaml` + `turbo.json`，让 `pnpm dev` 一条命令并行拉起 next + worker。**不抽任何 packages**，worker 留在 web 内。

## 为什么这次迁移这么简单

项目里所有路径都是「相对自身」的，整体平移一层目录后相对关系不变，**几乎不用改任何 import**。下面是逐一验证：

| 配置 | 原值（相对根目录） | 搬进 `apps/web/` 后 | 是否要改 |
| --- | --- | --- | --- |
| `tsconfig.json` 的 `@/*` → `./src/*` | 相对 tsconfig 自身 | tsconfig 一起搬，仍指向同目录的 `src/` | 否 |
| `schema.prisma` 的 `output = "../../src/shared/db/generator"` | 往上两层到根 | 往上两层正好到 `apps/web/`，再进 `src/shared/db/generator` | 否 |
| `prisma.config.ts` 的 `schema: "prisma/schema"` | 相对 cwd | 从 `apps/web/` 运行 prisma 命令时正确 | 否 |
| `components.json` 的 aliases（`@/shared/ui` 等） | 基于 tsconfig 别名 | 跟 tsconfig 一起搬 | 否 |
| `components.json` 的 `tailwind.css: "src/app/styles/global.css"` | 相对 components.json | 一起搬，相对位置不变 | 否 |
| `worker.ts` 的 `./src/shared/...` | 相对 worker.ts | 一起搬，相对位置不变 | 否 |
| `postcss.config.mjs` | 无路径依赖 | — | 否 |

## 目标结构

```
ai-spec/
├── apps/
│   └── web/                        # 整个项目搬进来
│       ├── app/                    # ← 原 app/
│       ├── src/                    # ← 原 src/（原封不动）
│       ├── public/                 # ← 原 public/
│       ├── prisma/                 # ← 原 prisma/
│       ├── worker.ts               # ← 原 worker.ts
│       ├── next.config.ts          # ← 原 next.config.ts
│       ├── tsconfig.json           # ← 原 tsconfig.json（@/* 别名保留）
│       ├── postcss.config.mjs      # ← 原 postcss.config.mjs
│       ├── prisma.config.ts        # ← 原 prisma.config.ts
│       ├── components.json         # ← 原 components.json
│       ├── eslint.config.mjs       # ← 原 eslint.config.mjs（只有 web 需要 lint）
│       ├── .env                    # ← 原 .env（Next 自动加载）
│       ├── next-env.d.ts           # 删掉让 next 重新生成
│       └── package.json            # 新建（承载原 dependencies）
├── packages/                       # 空目录占位
│   └── .gitkeep
├── .env.example                    # 留根目录（全局文档）
├── prettier.config.mjs             # 留根目录（全局格式化）
├── turbo.json                      # 新建
├── pnpm-workspace.yaml             # 新建
└── package.json                    # 改造为 workspace 根
```

## 执行步骤

### 前置：确保 git 干净

```bash
git status                       # 确认无未提交改动
git checkout -b chore/monorepo-migration
```

### 步骤 1：创建目录骨架

```bash
mkdir -p apps/web packages
```

### 步骤 2：用 git mv 移动文件（保留历史）

```bash
git mv app src public prisma apps/web/
git mv worker.ts next.config.ts tsconfig.json apps/web/
git mv postcss.config.mjs prisma.config.ts components.json apps/web/
git mv eslint.config.mjs apps/web/          # 只有 web 需要 lint
git mv .env apps/web/                        # Next 自动加载
rm -f next-env.d.ts                          # 让 next 重新生成
touch packages/.gitkeep                      # 占位
```

> 注意：`AGENTS.md`、`README.md`、`.gitignore`、`.env.example`、`prettier.config.mjs`、`pnpm-lock.yaml` **留在根目录不动**。
> 子目录里的 AGENTS.md（`app/AGENTS.md`、`app/api/AGENTS.md`、`src/AGENTS.md` 等）会随 `app/`、`src/` 一起搬进 `apps/web/`，内容不用改。

### 步骤 3：创建 `pnpm-workspace.yaml`（根目录）

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

### 步骤 4：改造根 `package.json`

把原 `package.json` 的所有 `dependencies` 和大部分 `devDependencies` 移到 `apps/web/package.json`（步骤 5）。根 `package.json` 只保留 workspace 工具：

```json
{
  "name": "ai-spec",
  "private": true,
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "lint": "turbo lint",
    "typecheck": "turbo typecheck"
  },
  "devDependencies": {
    "turbo": "^2.3.3",
    "prettier": "^3.8.3",
    "prettier-plugin-organize-imports": "^4.3.0",
    "prettier-plugin-tailwindcss": "^0.7.3"
  }
}
```

### 步骤 5：创建 `apps/web/package.json`

把原 `package.json` 的 `dependencies` **全部搬过来**；`devDependencies` 里只有 `prettier` 相关留在根目录，其余（tsx、@types/*、prisma、tailwindcss、eslint、eslint-config-next 等）搬到 web。新增 `concurrently`：

```json
{
  "name": "@repo/web",
  "private": true,
  "scripts": {
    "dev": "concurrently --kill-others \"next dev\" \"pnpm worker\"",
    "dev:web": "next dev",
    "worker": "tsx --conditions react-server worker.ts",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "typecheck": "tsc --noEmit",
    "email:dev": "email dev --dir src/shared/lib/infrastructure/email",
    "prisma:validate": "prisma validate",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:studio": "prisma studio"
  },
  "dependencies": {
    "@auth/prisma-adapter": "^2.11.2",
    "@aws-sdk/client-s3": "^3.1068.0",
    "@axiomhq/js": "^1.6.1",
    "@axiomhq/logging": "^0.2.2",
    "@axiomhq/nextjs": "^0.2.2",
    "@axiomhq/react": "^0.2.2",
    "@base-ui/react": "^1.4.1",
    "@hookform/resolvers": "^5.2.2",
    "@prisma/adapter-pg": "^7.8.0",
    "@prisma/client": "^7.8.0",
    "@tabler/icons-react": "^3.44.0",
    "bcryptjs": "^3.0.3",
    "bullmq": "^5.78.0",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "concurrently": "^9.1.0",
    "input-otp": "^1.4.2",
    "ioredis": "^5.10.1",
    "kbar": "0.1.0-beta.48",
    "lucide-react": "^1.11.0",
    "motion": "^12.38.0",
    "next": "16.2.4",
    "next-auth": "5.0.0-beta.31",
    "next-safe-action": "^8.5.2",
    "next-themes": "^0.4.6",
    "pg": "^8.20.0",
    "rate-limiter-flexible": "^11.1.0",
    "react": "19.2.4",
    "react-dom": "19.2.4",
    "react-email": "6.1.4",
    "react-hook-form": "^7.76.0",
    "resend": "^6.12.3",
    "server-only": "^0.0.1",
    "shadcn": "^4.5.0",
    "sonner": "^2.0.7",
    "tailwind-merge": "^3.5.0",
    "tw-animate-css": "^1.4.0",
    "uuid": "^14.0.0",
    "zod": "^4.4.3"
  },
  "devDependencies": {
    "@react-email/ui": "6.1.4",
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/pg": "^8.20.0",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "dotenv": "^17.4.2",
    "eslint": "^9",
    "eslint-config-next": "16.2.4",
    "prisma": "^7.8.0",
    "svgo": "^4.0.1",
    "tailwindcss": "^4",
    "tsx": "^4.22.4",
    "typescript": "^5"
  }
}
```

> 版本号以迁移时实际为准，上面是从原 `package.json` 拷贝的当前值。

### 步骤 6：创建 `turbo.json`（根目录）

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "dev": {
      "cache": false,
      "persistent": true
    },
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**"]
    },
    "lint": {},
    "typecheck": {}
  }
}
```

### 步骤 7：更新根 `AGENTS.md` 的项目结构图

根 `AGENTS.md` 里有项目结构示意，路径前缀要更新：

- `app/` → `apps/web/app/`
- `src/` → `apps/web/src/`
- `prisma/` → `apps/web/prisma/`
- `public/` → `apps/web/public/`

子目录的 AGENTS.md（`app/AGENTS.md`、`app/api/AGENTS.md`、`src/AGENTS.md` 等）内容不用改，它们说的是相对自己目录的规范。

### 步骤 8：（可选）创建 `tsconfig.base.json`（根目录）

如果未来有多个 apps 需要共享 tsconfig 基础配置，可在根目录建 `tsconfig.base.json`，各 app 的 tsconfig 用 `extends` 继承。阶段 1 只有一个 app，**可跳过此步**。

## 验证清单

执行完上述步骤后，逐项验证：

```bash
# 1. 清理旧缓存
rm -rf apps/web/.next

# 2. 安装依赖（pnpm 按 workspace 重新拓扑安装）
pnpm install

# 3. 重新生成 Prisma client（确认输出路径正确）
pnpm --filter @repo/web prisma:generate

# 4. 类型检查
pnpm typecheck

# 5. 启动验证（一条命令拉起 next + worker）
pnpm dev
#    预期：看到两个进程的日志
#    - next 在 http://localhost:3000
#    - worker 打印「头像同步 Worker 已启动，等待任务...」

# 6. 访问 http://localhost:3000 确认页面正常渲染
# 7. 触发一次登录，观察 worker 是否消费头像同步队列
```

## 风险点 & 回滚

| 风险 | 概率 | 处理 |
| --- | --- | --- |
| `eslint` 从子包跑时找不到 `eslint-config-next` | 中 | `eslint.config.mjs` 已随 web 搬入，依赖也在 web 包；若失败，把 eslint 配置退回根目录 |
| `.env` 未被 worker 加载 | 低 | worker.ts 有 `import "dotenv/config"`，cwd 是 `apps/web/`，会找到 `apps/web/.env` |
| shadcn `components.json` 的 css 路径 | 低 | `src/app/styles/global.css` 相对 components.json，已验证 OK |
| pnpm workspace 软链异常 | 低 | 删 `node_modules` 重装：`pnpm install --force` |
| `next-safe-action` 等 Next 生态包在子包解析异常 | 低 | pnpm workspace 会正确软链，通常无碍 |

**回滚**：全程在 `chore/monorepo-migration` 分支进行。出问题直接：

```bash
git checkout main          # 或迁移前的分支
git branch -D chore/monorepo-migration
```

所有移动都用 `git mv`，历史完整，回滚无损。

## 完成后该做什么

1. **更新本文件状态**：把顶部「状态：未实施」改为「状态：已完成」，追加执行日期和 commit hash。
2. **更新根 `AGENTS.md`**：项目结构图同步为新路径（步骤 7）。
3. **考虑打 tag**：当基础界面也开发完成、整体可作为复用基线时：
   ```bash
   git tag -a v0.2.0-monorepo-base -m "Monorepo 骨架完成，作为后台项目复用基线"
   ```
4. **不要立刻进入阶段 2**：阶段 2（抽 packages）有明确触发条件，见 [ADR-004](./decisions.md#adr-004阶段-1-走最小骨架不抽-packages) 的「何时应重新评估」。在触发条件满足前，保持当前结构。

## 执行记录

（执行后在此追加）

- YYYY-MM-DD：执行人 / commit hash / 备注

# 部署指南

把 AI Spec 部署到自己的云主机（VPS），用 Docker Compose 一键拉起整个应用栈。

## 架构总览

```
┌─────────── 服务器（一台云主机，已装 Docker + Docker Compose）──────────┐
│                                                                       │
│   app-web    (Next.js 生产镜像, :3000)  ← 唯一对外的应用端口           │
│      ↕                                                                 │
│   app-worker (后台 Worker，扫描/翻译/队列，不对外)                     │
│      ↕                                                                 │
│   postgres   (PostgreSQL 17)    redis (Redis 8)    minio (S3 兼容存储) │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

**镜像设计**：`app-web` 和 `app-worker` 共用同一个镜像（`ai-spec:latest`），通过启动参数区分角色。这样构建一次即可，两者代码完全一致。

**数据库迁移**：仅 `app-web` 在启动时执行 `prisma migrate deploy`，`app-worker` 等 web 健康检查通过后再启动，避免并发迁移冲突。

---

## 前置准备

### 1. 服务器要求

| 项目 | 最低 | 推荐 |
|---|---|---|
| CPU | 1 核 | 2 核 |
| 内存 | 2 GB | 4 GB |
| 磁盘 | 20 GB | 40 GB（含 Postgres + MinIO 数据） |
| 系统 | Linux（Ubuntu 22.04+ / Debian 12+ / CentOS 等） | Ubuntu 22.04 LTS |
| 端口 | 3000（web）、9001（MinIO 控制台）对公网开放 | - |

### 2. 安装 Docker

在服务器上执行（Ubuntu/Debian 示例）：

```bash
# 一键脚本（官方）
curl -fsSL https://get.docker.com | sh

# 把当前用户加进 docker 组，免 sudo
sudo usermod -aG docker $USER
newgrp docker

# 验证
docker --version
docker compose version
```

> 阿里云/腾讯云国内服务器拉镜像慢，可配置镜像加速器，参考各自文档。

---

## 部署步骤

### 步骤 1：把代码放到服务器

```bash
# 方式 A：git 克隆（推荐）
cd ~
git clone <你的仓库地址> ai-spec
cd ai-spec

# 方式 B：本地打包上传
# 在本地：tar czf ai-spec.tar.gz --exclude=node_modules --exclude=.next ai-spec
# scp ai-spec.tar.gz user@服务器IP:~/，再在服务器解压
```

### 步骤 2：配置生产环境变量

```bash
# 从模板复制
cp .env.production.example .env.production

# 生成必要的密钥（记下来填进 .env.production）
openssl rand -base64 32  # 用作 POSTGRES_PASSWORD
openssl rand -base64 32  # 用作 REDIS_PASSWORD
openssl rand -base64 32  # 用作 MINIO_ROOT_PASSWORD（至少 8 位）
openssl rand -base64 32  # 用作 AUTH_SECRET
```

编辑 `.env.production`，**必须修改**的项：

```bash
POSTGRES_PASSWORD=<上面生成的>      # 必填
REDIS_PASSWORD=<上面生成的>          # 必填
MINIO_ROOT_PASSWORD=<上面生成的>     # 必填
AUTH_SECRET=<上面生成的>             # 必填
BASE_URL="http://<服务器公网IP>:3000"  # 改成真实 IP
S3_PUBLIC_URL="http://<服务器公网IP>:9001/ai-spec-public"
```

按需填写（不填对应功能不可用，但应用能启动）：
- `AUTH_SECRET` 是**唯一强制的应用密钥**——不填登录会失败
- `GITHUB_CLIENT_ID/SECRET`、`GOOGLE_CLIENT_ID/SECRET`：第三方登录
- `RESEND_API_KEY`：邮件发送（注册验证邮件）
- `GITHUB_TOKEN`：广场抓取
- `TENCENT_*`：广场翻译

#### 从本地开发环境迁移配置（可选，省事）

如果你想复用本地 `.env` 里已经配好的第三方服务 key（Resend、OAuth、翻译等），按下表对照填写。**只有第三类「第三方服务 key」可以复用**——基础设施密码必须新生成，因为生产容器是全新的实例。

| 配置项 | 类别 | 处理方式 |
|---|---|---|
| `POSTGRES_PASSWORD` | 基础设施密码 | **必须新生成**（生产容器独立） |
| `REDIS_PASSWORD` | 基础设施密码 | **必须新生成** |
| `MINIO_ROOT_PASSWORD` | 基础设施密码 | **必须新生成** |
| `AUTH_SECRET` | 应用密钥 | **必须新生成**（或复用本地值，但建议换新的） |
| `RESEND_API_KEY` | 第三方服务 | 可复用本地 `.env` 里的值 |
| `GOOGLE_CLIENT_ID/SECRET` | 第三方服务 | 可复用（需在 Google Console 加生产回调地址） |
| `GITHUB_CLIENT_ID/SECRET` | 第三方服务 | 可复用（需在 GitHub OAuth App 加生产回调地址） |
| `GITHUB_TOKEN` | 第三方服务 | 可复用 |
| `TENCENT_SECRET_ID/KEY` | 第三方服务 | 可复用 |
| `AXIOM_TOKEN` | 第三方服务 | 可复用（`IS_AXIOM_ENABLED=true` 时才用） |

> ! 第三方登录（Google/GitHub OAuth）复用时，必须去对应控制台把生产域名加进授权回调地址，否则登录会报 `redirect_uri_mismatch`。例如 GitHub：到 OAuth App 设置里把 `https://<生产域名>/api/auth/callback/github` 加上。

### 步骤 3：构建镜像

```bash
# 在项目根目录执行（首次约 5~10 分钟，后续命中缓存约 1~2 分钟）
docker compose -f docker-compose.prod.yml --env-file .env.production build
```

### 步骤 4：启动全部服务

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up -d
```

首次启动会按顺序：起 Postgres/Redis/MinIO → 等 healthy → 起 `app-web`（执行迁移）→ 起 `app-worker` → 起 `minio-init`（建桶）。

### 步骤 5：验证

```bash
# 看所有容器状态，应全部 Up / healthy
docker compose -f docker-compose.prod.yml ps

# 健康检查接口（应返回 {"status":"ok",...}）
curl http://localhost:3000/api/health

# 浏览器访问
http://<服务器公网IP>:3000
```

---

## 日常运维

### 常用命令

```bash
# 设个简写，省得每次敲长命令
alias dcp='docker compose -f docker-compose.prod.yml --env-file .env.production'

dcp ps              # 查看状态
dcp logs -f app-web # 跟踪 web 日志
dcp logs -f app-worker
dcp restart app-web # 重启某个服务
dcp down            # 停止并移除容器（数据卷保留）
dcp up -d           # 重新启动
```

### 更新版本（代码有更新后）

```bash
cd ~/ai-spec
git pull                          # 拉新代码
dcp build                         # 重新构建镜像
dcp up -d                         # 滚动重启（迁移会自动执行）
```

### 查看数据库

```bash
# 进 Postgres 容器
dcp exec postgres psql -U $POSTGRES_USER -d $POSTGRES_DB
```

### MinIO 控制台

浏览器访问 `http://<服务器公网IP>:9001`，用 `.env.production` 里的 `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD` 登录。

---

## 数据备份

### 手动备份

```bash
# 备份数据库（在服务器上）
dcp exec postgres pg_dump -U $POSTGRES_USER $POSTGRES_DB | gzip > backup_$(date +%F).sql.gz

# 备份 MinIO 数据（整个卷）
docker run --rm -v ai-spec-prod_minio-data:/data -v $(pwd):/backup alpine \
  tar czf /backup/minio_$(date +%F).tar.gz -C /data .
```

### 自动备份（cron 示例）

```bash
# crontab -e，每天凌晨 3 点备份
0 3 * * * cd ~/ai-spec && docker compose -f docker-compose.prod.yml exec -T postgres pg_dump -U ai_spec ai_spec | gzip > /backups/db_$(date +\%F).sql.gz
```

---

## 上 HTTPS（有域名后）

先用 IP 跑通验证，确认没问题后再加域名 + HTTPS。最简单是加一个 Nginx 反向代理 + Let's Encrypt：

```bash
# 服务器上装 Nginx + certbot
sudo apt install -y nginx certbot python3-certbot-nginx

# Nginx 配置（/etc/nginx/sites-available/ai-spec）
# 把 80 端口反代到 docker 的 3000 端口：
#   location / { proxy_pass http://127.0.0.1:3000; ... }

# 申请证书（自动改 Nginx 配置）
sudo certbot --nginx -d your-domain.com
```

上完域名后，记得改 `.env.production`：
```bash
BASE_URL="https://your-domain.com"
S3_PUBLIC_URL="https://your-domain.com/ai-spec-public"
```
然后 `dcp up -d` 重启。

---

## 常见问题排查

### 启动后访问不了

```bash
# 1. 容器在不在
dcp ps

# 2. 防火墙开了没（云主机安全组 + 本机 iptables）
sudo ufw status            # Ubuntu
# 云控制台安全组：放行 3000 端口入站

# 3. web 进程起的来不
dcp logs app-web
```

### 数据库迁移失败

```bash
dcp logs app-web | grep -A20 "迁移"
# 常见原因：POSTGRES_PASSWORD 拼错、Postgres 容器没起好就尝试连
```

### Worker 不工作

```bash
dcp logs app-worker
# worker 依赖 web healthy 才启动，先确认 web 是 healthy
dcp ps
```

### MinIO 桶没建

`minio-init` 是一次性任务，只在首次启动跑。若首次失败，手动执行：

```bash
dcp run --rm minio-init
```

### 端口被占用

```bash
# 改 .env.production 里的端口映射
WEB_PORT=3001            # web 换端口
MINIO_CONSOLE_PORT=9002  # MinIO 控制台换端口
```

---

## 系统资源调优（可选）

内存紧张（2GB 服务器）时，给 Postgres 加上限：

```yaml
# docker-compose.prod.yml 的 postgres 服务加：
command: postgres -c shared_buffers=128MB -c max_connections=50
```

应用内存不足表现为 OOM（容器被 kill 后重启），看日志：
```bash
docker inspect ai-spec-prod-web --format '{{.State.OOMKilled}}'
```

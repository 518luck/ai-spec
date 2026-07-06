# ai-spec RBAC 参考 v4.0

> **对应代码**：`src/shared/lib/api/rbac/permissions.ts` + `resources.ts`
> **v3.0 设计文档**：保留在 `RBAC设计v3.md`

---

## §1 角色（3 个）

权限层级：`guest < user < member`

| 角色     | 含义               | 权限范围                     |
| -------- | ------------------ | ---------------------------- |
| `guest`  | 游客，未登录用户   | 个人内容/共享/设置资源的只读 |
| `user`   | 用户，普通登录用户 | 个人内容/共享/设置资源的读写 |
| `member` | 会员，高级会员     | 全部资源的读写               |

---

## §2 资源（15 个）

| 资源 key       | 中文名                     | 分类     |
| -------------- | -------------------------- | -------- |
| `promptRecord` | 提示词-收录                | 个人内容 |
| `promptDraft`  | 提示词-草稿                | 个人内容 |
| `rules`        | 规约库                     | 个人内容 |
| `agentMD`      | AGENTS.md 文档             | 共享资源 |
| `skills`       | Skills                     | 共享资源 |
| `agents`       | 智能体（Agents）           | 共享资源 |
| `plugins`      | Plugins                    | 共享资源 |
| `project`      | 项目                       | 工作空间 |
| `member`       | 成员（邀请、移除、改角色） | 工作空间 |
| `team`         | 团队/工作空间设置          | 工作空间 |
| `security`     | 安全策略                   | 工作空间 |
| `logs`         | 操作日志                   | 工作空间 |
| `profile`      | 个人详情                   | 设置     |
| `preference`   | 个人偏好                   | 设置     |
| `secretKey`    | API Key                    | 设置     |

---

## §3 动作（2 个）

| 动作    | 语义                               |
| ------- | ---------------------------------- |
| `read`  | 查看 / 浏览                        |
| `write` | 新建 / 编辑 / 删除（所有写入操作） |

---

## §4 权限位（30 个）

每个资源 × 2 个动作（read / write），共 30 个权限位。

| 权限位               | 语义                         |
| -------------------- | ---------------------------- |
| `promptRecord.read`  | 浏览已收录的提示词           |
| `promptRecord.write` | 新建/编辑/删除已收录的提示词 |
| `promptDraft.read`   | 查看自己的提示词草稿         |
| `promptDraft.write`  | 新建/编辑/删除提示词草稿     |
| `rules.read`         | 查看规约库                   |
| `rules.write`        | 新建/编辑规约                |
| `agentMD.read`       | 查看 AGENTS.md 文档          |
| `agentMD.write`      | 编辑 AGENTS.md 文档          |
| `skills.read`        | 查看 Skills                  |
| `skills.write`       | 新建/编辑/删除 Skills        |
| `agents.read`        | 查看智能体                   |
| `agents.write`       | 新建/编辑/删除智能体         |
| `plugins.read`       | 查看 Plugins                 |
| `plugins.write`      | 新建/编辑/删除 Plugins       |
| `project.read`       | 查看团队项目                 |
| `project.write`      | 新建/编辑/管理团队项目       |
| `member.read`        | 查看团队成员列表             |
| `member.write`       | 邀请/移除成员、改角色        |
| `team.read`          | 查看团队设置                 |
| `team.write`         | 修改团队设置                 |
| `security.read`      | 查看团队安全策略             |
| `security.write`     | 修改团队安全策略             |
| `logs.read`          | 查看团队操作日志             |
| `logs.write`         | 清理/导出团队操作日志        |
| `profile.read`       | 查看个人资料                 |
| `profile.write`      | 修改个人资料                 |
| `preference.read`    | 查看个人偏好                 |
| `preference.write`   | 修改个人偏好                 |
| `secretKey.read`     | 查看自己的 API Key           |
| `secretKey.write`    | 创建/删除/重置 API Key       |

---

## §5 权限矩阵

`✅` 拥有权限，`❌` 无权限。

### 个人内容资源

| 权限位               | guest | user | member |
| -------------------- | :---: | :--: | :----: |
| `promptRecord.read`  |  ✅   |  ✅  |   ✅   |
| `promptRecord.write` |  ❌   |  ✅  |   ✅   |
| `promptDraft.read`   |  ✅   |  ✅  |   ✅   |
| `promptDraft.write`  |  ❌   |  ✅  |   ✅   |
| `rules.read`         |  ✅   |  ✅  |   ✅   |
| `rules.write`        |  ❌   |  ✅  |   ✅   |

### 共享资源

| 权限位          | guest | user | member |
| --------------- | :---: | :--: | :----: |
| `agentMD.read`  |  ✅   |  ✅  |   ✅   |
| `agentMD.write` |  ❌   |  ✅  |   ✅   |
| `skills.read`   |  ✅   |  ✅  |   ✅   |
| `skills.write`  |  ❌   |  ✅  |   ✅   |
| `agents.read`   |  ✅   |  ✅  |   ✅   |
| `agents.write`  |  ❌   |  ✅  |   ✅   |
| `plugins.read`  |  ✅   |  ✅  |   ✅   |
| `plugins.write` |  ❌   |  ✅  |   ✅   |

### 工作空间资源

| 权限位           | guest | user | member |
| ---------------- | :---: | :--: | :----: |
| `project.read`   |  ❌   |  ❌  |   ✅   |
| `project.write`  |  ❌   |  ❌  |   ✅   |
| `member.read`    |  ❌   |  ❌  |   ✅   |
| `member.write`   |  ❌   |  ❌  |   ✅   |
| `team.read`      |  ❌   |  ❌  |   ✅   |
| `team.write`     |  ❌   |  ❌  |   ✅   |
| `security.read`  |  ❌   |  ❌  |   ✅   |
| `security.write` |  ❌   |  ❌  |   ✅   |
| `logs.read`      |  ❌   |  ❌  |   ✅   |
| `logs.write`     |  ❌   |  ❌  |   ✅   |

### 设置资源

| 权限位             | guest | user | member |
| ------------------ | :---: | :--: | :----: |
| `profile.read`     |  ✅   |  ✅  |   ✅   |
| `profile.write`    |  ❌   |  ✅  |   ✅   |
| `preference.read`  |  ✅   |  ✅  |   ✅   |
| `preference.write` |  ❌   |  ✅  |   ✅   |
| `secretKey.read`   |  ✅   |  ✅  |   ✅   |
| `secretKey.write`  |  ❌   |  ✅  |   ✅   |

### 矩阵总结

| 角色     | 权限数 | 范围                              |
| -------- | ------ | --------------------------------- |
| `guest`  | 10 项  | 个人内容/共享/设置的 read         |
| `user`   | 20 项  | 个人内容/共享/设置的 read + write |
| `member` | 30 项  | 全部资源的 read + write           |

---

## §6 代码结构

```
src/shared/lib/api/rbac/
├── permissions.ts    # 角色类型 + 权限动作 + 角色权限映射
└── resources.ts      # 资源 key + 资源元信息
```

### permissions.ts 导出

| 导出                 | 类型        | 说明                            |
| -------------------- | ----------- | ------------------------------- |
| `ROLE`               | type        | `"guest" \| "user" \| "member"` |
| `PERMISSION_ACTIONS` | const array | 30 个权限动作                   |
| `PermissionAction`   | type        | 权限动作类型                    |
| `ROLE_PERMISSIONS`   | const array | 权限 → 角色[] 映射表            |

### resources.ts 导出

| 导出            | 类型        | 说明                                   |
| --------------- | ----------- | -------------------------------------- |
| `RESOURCE_KEYS` | const array | 15 个资源 key                          |
| `ResourceKey`   | type        | 资源 key 类型                          |
| `RESOURCES`     | const array | 资源元信息（key + name + description） |

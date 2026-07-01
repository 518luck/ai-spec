// 受限 API Key 的权限范围映射体系：scope → 实际放行权限，并约束各角色可授予的范围
//
// 现状：当前仅个人空间，登录用户（user/member）可授予全部 scope，roles 字段暂无筛选效果。
// 团队功能上线后，member 才会与 user 在可授予范围上产生区分（如项目/团队资源）。
import type {
  PermissionAction,
  ROLE,
} from "@/shared/lib/ohs/local/appservice/rbac/permissions";
import type { ResourceKey } from "@/shared/lib/ohs/local/appservice/rbac/resources";

// 所有合法 scope 字符串的户口本，兼作 zod 校验合法值与 Scope 字面量类型的来源
export const SCOPES = [
  // —— 个人内容资源 ——
  "promptRecord.read",
  "promptRecord.write",
  "promptDraft.read",
  "promptDraft.write",
  "rules.read",
  "rules.write",

  // —— 共享资源 ——
  "agentMD.read",
  "agentMD.write",
  "skills.read",
  "skills.write",
  "agents.read",
  "agents.write",
  "plugins.read",
  "plugins.write",

  // —— 通配 scope：跨资源的打包权限 ——
  "apis.read", // 所有资源的只读
  "apis.all", // 所有资源的读写
] as const;

export type Scope = (typeof SCOPES)[number];

// scope 的权威解释表：每个 scope 映射到可授角色、实际放行权限及所属资源
// 规律：write 的 permissions 隐含同资源 read；通配 scope 无 resource/type
type ResourceScopeEntry = {
  scope: Scope;
  roles: readonly ROLE[];
  permissions: readonly PermissionAction[];
  type?: "read" | "write";
  resource?: ResourceKey;
};

export const RESOURCE_SCOPES: readonly ResourceScopeEntry[] = [
  // ---------- 提示词-收录 ----------
  {
    scope: "promptRecord.read",
    roles: ["user", "member"],
    permissions: ["promptRecord.read"],
    type: "read",
    resource: "promptRecord",
  },
  {
    scope: "promptRecord.write",
    roles: ["user", "member"],
    permissions: ["promptRecord.write", "promptRecord.read"],
    type: "write",
    resource: "promptRecord",
  },
  // ---------- 提示词-草稿 ----------
  {
    scope: "promptDraft.read",
    roles: ["user", "member"],
    permissions: ["promptDraft.read"],
    type: "read",
    resource: "promptDraft",
  },
  {
    scope: "promptDraft.write",
    roles: ["user", "member"],
    permissions: ["promptDraft.write", "promptDraft.read"],
    type: "write",
    resource: "promptDraft",
  },
  // ---------- 规约库 ----------
  {
    scope: "rules.read",
    roles: ["user", "member"],
    permissions: ["rules.read"],
    type: "read",
    resource: "rules",
  },
  {
    scope: "rules.write",
    roles: ["user", "member"],
    permissions: ["rules.write", "rules.read"],
    type: "write",
    resource: "rules",
  },
  // ---------- AGENTS.md ----------
  {
    scope: "agentMD.read",
    roles: ["user", "member"],
    permissions: ["agentMD.read"],
    type: "read",
    resource: "agentMD",
  },
  {
    scope: "agentMD.write",
    roles: ["user", "member"],
    permissions: ["agentMD.write", "agentMD.read"],
    type: "write",
    resource: "agentMD",
  },
  // ---------- Skills ----------
  {
    scope: "skills.read",
    roles: ["user", "member"],
    permissions: ["skills.read"],
    type: "read",
    resource: "skills",
  },
  {
    scope: "skills.write",
    roles: ["user", "member"],
    permissions: ["skills.write", "skills.read"],
    type: "write",
    resource: "skills",
  },
  // ---------- 智能体 ----------
  {
    scope: "agents.read",
    roles: ["user", "member"],
    permissions: ["agents.read"],
    type: "read",
    resource: "agents",
  },
  {
    scope: "agents.write",
    roles: ["user", "member"],
    permissions: ["agents.write", "agents.read"],
    type: "write",
    resource: "agents",
  },
  // ---------- Plugins ----------
  {
    scope: "plugins.read",
    roles: ["user", "member"],
    permissions: ["plugins.read"],
    type: "read",
    resource: "plugins",
  },
  {
    scope: "plugins.write",
    roles: ["user", "member"],
    permissions: ["plugins.write", "plugins.read"],
    type: "write",
    resource: "plugins",
  },
  // ---------- 通配 scope：跨资源的打包权限（无 resource/type）----------
  {
    scope: "apis.read",
    roles: ["user", "member"],
    permissions: [
      "promptRecord.read",
      "promptDraft.read",
      "rules.read",
      "agentMD.read",
      "skills.read",
      "agents.read",
      "plugins.read",
    ],
  },
  {
    scope: "apis.all",
    roles: ["user", "member"],
    permissions: [
      "promptRecord.read",
      "promptRecord.write",
      "promptDraft.read",
      "promptDraft.write",
      "rules.read",
      "rules.write",
      "agentMD.read",
      "agentMD.write",
      "skills.read",
      "skills.write",
      "agents.read",
      "agents.write",
      "plugins.read",
      "plugins.write",
    ],
  },
];

// —— 派生查询：基于 RESOURCE_SCOPES 按需查询，零预计算表以保持类型安全 ——

// 单条 scope 展开为实际放行权限；未知 scope 返回空
export const getPermissionsForScope = (
  scope: Scope,
): readonly PermissionAction[] =>
  RESOURCE_SCOPES.find((item) => item.scope === scope)?.permissions ?? [];

// 取某资源的全部资源级 scope，供前端渲染「资源 × 读/写」勾选表
export const getScopesForResource = (
  resource: ResourceKey,
): readonly {
  scope: Scope;
  type: "read" | "write";
  roles: readonly ROLE[];
}[] =>
  RESOURCE_SCOPES.filter(
    (item): item is ResourceScopeEntry & { type: "read" | "write" } =>
      item.resource === resource && item.type !== undefined,
  ).map((item) => ({
    scope: item.scope,
    type: item.type,
    roles: item.roles,
  }));

// 取某角色可授予的全部 scope
export const getScopesForRole = (role: ROLE): readonly Scope[] =>
  RESOURCE_SCOPES.filter((item) => item.roles.includes(role)).map(
    (item) => item.scope,
  );

// 把 token 的 scopes 展开成实际权限集合（鉴权热路径用）
export const mapScopesToPermissions = (
  scopes: readonly Scope[],
): PermissionAction[] => {
  const permissions: PermissionAction[] = [];
  for (const scope of scopes) {
    permissions.push(...getPermissionsForScope(scope));
  }
  return permissions;
};

// 校验 scopes 是否在该角色可授予范围内，防止越权授予
export const validateScopesForRole = (
  scopes: readonly Scope[],
  role: ROLE,
): boolean => {
  const allowed = new Set(getScopesForRole(role));
  return scopes.every((scope) => allowed.has(scope));
};

// 前端「全部 / 只读 / 限制」三档预设的展示元数据
export const scopePresets = [
  {
    value: "all_access",
    label: "全部",
    description: "对所有资源拥有完整的读写权限",
  },
  {
    value: "read_only",
    label: "只读",
    description: "对所有资源拥有只读权限，无法进行任何修改",
  },
  {
    value: "restricted",
    label: "限制",
    description: "仅能访问指定的资源",
  },
] as const;

// 从 scopes 反推所属预设（编辑已有 key 时高亮按钮用）
export const scopesToName = (
  scopes: readonly string[],
): { name: string; description: string } => {
  if (scopes.includes("apis.all")) {
    return { name: "全部", description: "对所有资源拥有完整的读写权限" };
  }
  if (scopes.includes("apis.read")) {
    return {
      name: "只读",
      description: "对所有资源拥有只读权限，无法进行任何修改",
    };
  }
  return { name: "限制", description: "仅能访问指定的资源" };
};

// 合并去重资源级 scope，保留最强权限：同资源同时有 read 和 write 时只留 write
export const consolidateScopes = (scopes: readonly Scope[]): Scope[] => {
  const writeResources = new Set<string>();
  for (const scope of scopes) {
    if (scope.endsWith(".write")) {
      writeResources.add(scope.slice(0, -".write".length));
    }
  }

  const consolidated = new Set<Scope>();
  for (const scope of scopes) {
    if (scope.endsWith(".write")) {
      consolidated.add(scope);
    } else if (scope.endsWith(".read")) {
      const resource = scope.slice(0, -".read".length);
      if (!writeResources.has(resource)) {
        consolidated.add(scope);
      }
    }
  }
  return [...consolidated];
};

// API Key 的权限范围（scope）体系：合法 scope、资源映射、预设与查询
//
// scope 来源：从 actions.ts 的 API_KEY_SCOPES 派生（个人资源 read/write），
// 外加两个通配 scope（apis.read / apis.all）做跨资源打包授权。
// 团队专属 action 因 apiKeyGrantable=false 不会出现在 scope 里。
import type { ResourceKey } from "@/server/rbac/resource-ui";
import { RESOURCES } from "@/server/rbac/resource-ui";
import { API_KEY_SCOPES } from "./actions";

// 所有合法 scope 字符串：个人资源 action（派生）+ 两个通配打包权限
export const SCOPES = [...API_KEY_SCOPES, "apis.read", "apis.all"] as const;

export type Scope = (typeof SCOPES)[number];

// scope 的权威解释表：每个资源级 scope 映射到所属资源与读写类型
type ResourceScopeEntry = {
	scope: Scope;
	type?: "read" | "write";
	resource?: ResourceKey;
};

export const RESOURCE_SCOPES: readonly ResourceScopeEntry[] = [
	// ---------- 提示词-收录 ----------
	{ scope: "promptRecord.read", type: "read", resource: "promptRecord" },
	{ scope: "promptRecord.write", type: "write", resource: "promptRecord" },
	// ---------- 提示词-草稿 ----------
	{ scope: "promptDraft.read", type: "read", resource: "promptDraft" },
	{ scope: "promptDraft.write", type: "write", resource: "promptDraft" },
	// ---------- 规约库 ----------
	{ scope: "rules.read", type: "read", resource: "rules" },
	{ scope: "rules.write", type: "write", resource: "rules" },
	// ---------- AGENTS.md ----------
	{ scope: "agentMD.read", type: "read", resource: "agentMD" },
	{ scope: "agentMD.write", type: "write", resource: "agentMD" },
	// ---------- Skills ----------
	{ scope: "skills.read", type: "read", resource: "skills" },
	{ scope: "skills.write", type: "write", resource: "skills" },
	// ---------- 智能体 ----------
	{ scope: "agents.read", type: "read", resource: "agents" },
	{ scope: "agents.write", type: "write", resource: "agents" },
	// ---------- Plugins ----------
	{ scope: "plugins.read", type: "read", resource: "plugins" },
	{ scope: "plugins.write", type: "write", resource: "plugins" },
];

// —— 以下为前端 UI 专用：API Key 弹窗渲染、列表展示、勾选回填 ——

// 前端「全部 / 只读 / 限制」三档预设：展示元数据 + 对应的通配 scope
// 「限制」无固定 scope（取决于用户勾选），其 scopes 留空，由调用方按勾选生成
export const scopePresets = [
	{
		value: "all_access",
		label: "全部",
		description: "对所有资源拥有完整的读写权限",
		scopes: ["apis.all"] as const,
	},
	{
		value: "read_only",
		label: "只读",
		description: "对所有资源拥有只读权限，无法进行任何修改",
		scopes: ["apis.read"] as const,
	},
	{
		value: "restricted",
		label: "限制",
		description: "仅能访问指定的资源",
		scopes: [] as const,
	},
] as const;

// 预设 value 的字面量类型，供弹窗等消费方约束选项
export type ScopePresetValue = (typeof scopePresets)[number]["value"];

// 取某资源的全部资源级 scope，供前端渲染「资源 × 读/写」勾选表
export const getScopesForResource = (
	resource: ResourceKey,
): readonly {
	scope: Scope;
	type: "read" | "write";
}[] =>
	RESOURCE_SCOPES.filter(
		(item): item is ResourceScopeEntry & { type: "read" | "write" } =>
			item.resource === resource && item.type !== undefined,
	).map((item) => ({
		scope: item.scope,
		type: item.type,
	}));

// 从 scopes 反推所属预设（编辑已有 key 时高亮按钮用）
export const scopesToName = (scopes: readonly string[]): { name: string; description: string } => {
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

// 通配 scope 的中文描述（跨资源打包授权，不属任何具体资源）
const WILDCARD_SCOPE_LABELS: Record<string, string> = {
	"apis.all": "全部资源 读写",
	"apis.read": "全部资源 只读",
};

// 把单个 scope 翻译成「中文名(scope 字符串)」格式，供错误信息等面向人类的场景使用
// 资源级 scope 查 RESOURCES 拿中文名 + 按 type 加「读取/写入」后缀；通配 scope 用固定描述；未知原样返回
export const formatScope = (scope: string): string => {
	// 通配 scope：apis.all / apis.read
	if (WILDCARD_SCOPE_LABELS[scope]) {
		return `${WILDCARD_SCOPE_LABELS[scope]}(${scope})`;
	}

	// 资源级 scope：从 RESOURCE_SCOPES 找到 resource + type，再查 RESOURCES 拿中文名
	const entry = RESOURCE_SCOPES.find((item) => item.scope === scope);
	if (entry?.resource && entry.type) {
		const resourceName = RESOURCES.find((r) => r.key === entry.resource)?.name ?? entry.resource;
		const typeLabel = entry.type === "write" ? "写入" : "读取";
		return `${resourceName} ${typeLabel}(${scope})`;
	}

	// 未知 scope（理论上不会出现，兜底）：原样返回
	return scope;
};

// # TanStack Query queryKey 工厂：统一三层结构 [资源域, 操作类型, 参数]
// > 靠前缀做广播失效：invalidateQueries({ queryKey: ["rules"] }) 刷 rules 的一切
// 迁移自 SWR 的混乱 key 前缀（rule/rules 单复数、rules-infinite 等），统一收口

// 规约
export const ruleKeys = {
	all: ["rules"] as const,
	lists: () => [...ruleKeys.all, "list"] as const,
	list: (params: Record<string, unknown>) => [...ruleKeys.lists(), params] as const,
	infinite: (params: Record<string, unknown>) => [...ruleKeys.all, "infinite", params] as const,
	details: () => [...ruleKeys.all, "detail"] as const,
	detail: (id: string) => [...ruleKeys.details(), { id }] as const,
	versionDetails: () => [...ruleKeys.all, "versionDetail"] as const,
	versionDetail: (ruleId: string, versionId: string) =>
		[...ruleKeys.versionDetails(), { ruleId, versionId }] as const,
	versions: () => [...ruleKeys.all, "versions"] as const,
} as const;

// 规约领域空间
export const ruleSpaceKeys = {
	all: ["ruleSpaces"] as const,
	list: () => [...ruleSpaceKeys.all, "list"] as const,
} as const;

// 提示词-收录
export const recordKeys = {
	all: ["records"] as const,
	lists: () => [...recordKeys.all, "list"] as const,
	infinite: (params: Record<string, unknown>) => [...recordKeys.all, "infinite", params] as const,
	details: () => [...recordKeys.all, "detail"] as const,
	detail: (id: string) => [...recordKeys.details(), { id }] as const,
	versionDetails: () => [...recordKeys.all, "versionDetail"] as const,
	versionDetail: (recordId: string, versionId: string) =>
		[...recordKeys.versionDetails(), { recordId, versionId }] as const,
} as const;

// 提示词-草稿
export const draftKeys = {
	all: ["drafts"] as const,
	infinite: (params: Record<string, unknown>) => [...draftKeys.all, "infinite", params] as const,
	details: () => [...draftKeys.all, "detail"] as const,
	detail: (id: string) => [...draftKeys.details(), { id }] as const,
} as const;

// 文件夹
export const folderKeys = {
	all: ["folders"] as const,
	list: (params: { resourceType: string; spaceId?: string }) =>
		[...folderKeys.all, "list", params] as const,
} as const;

// 标签
export const tagKeys = {
	all: ["tags"] as const,
	list: (resourceType: string) => [...tagKeys.all, "list", { resourceType }] as const,
} as const;

// 发现广场 skills
export const discoverSkillKeys = {
	all: ["discoverSkills"] as const,
	infinite: (params: Record<string, unknown>) =>
		[...discoverSkillKeys.all, "infinite", params] as const,
} as const;

// 发现广场组织
export const discoverOrganizationKeys = {
	all: ["discoverOrganizations"] as const,
	list: () => [...discoverOrganizationKeys.all, "list"] as const,
} as const;

// 通用版本页（records 和 rules 共用 VersionPage 组件，用 resourceType 区分）
export const versionKeys = {
	all: ["versions"] as const,
	infinite: (resourceType: "record" | "rule", resourceId: string) =>
		[...versionKeys.all, "infinite", { resourceType, resourceId }] as const,
	content: (resourceType: "record" | "rule", resourceId: string, versionId: string) =>
		[...versionKeys.all, "content", { resourceType, resourceId, versionId }] as const,
} as const;

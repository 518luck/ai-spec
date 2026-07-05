import { describe, expect, test } from "vitest";

import {
	consolidateScopes,
	getPermissionsForScope,
	getScopesForResource,
	mapScopesToPermissions,
	SCOPES,
	scopePresets,
	scopesToName,
} from "./scopes";

// 户口本：登记的 scope 数量应与权威表一致，新增 scope 时两处需同步
describe("SCOPES 户口本", () => {
	test("包含全部 16 个合法 scope", () => {
		expect(SCOPES.length).toBe(16);
	});
});

// 预设自带 scope：全部/只读映射到通配 scope，限制留空由勾选生成
describe("scopePresets", () => {
	test("全部 → apis.all", () => {
		const preset = scopePresets.find((p) => p.value === "all_access");
		expect(preset?.scopes).toEqual(["apis.all"]);
	});

	test("只读 → apis.read", () => {
		const preset = scopePresets.find((p) => p.value === "read_only");
		expect(preset?.scopes).toEqual(["apis.read"]);
	});

	test("限制 → 空（由用户勾选生成）", () => {
		const preset = scopePresets.find((p) => p.value === "restricted");
		expect(preset?.scopes).toEqual([]);
	});
});

// 单条 scope → 实际放行权限；核心规律是「写隐含读」
describe("getPermissionsForScope", () => {
	test("write 隐含同资源 read", () => {
		expect(getPermissionsForScope("promptRecord.write")).toEqual([
			"promptRecord.write",
			"promptRecord.read",
		]);
	});

	test("read 仅含自身", () => {
		expect(getPermissionsForScope("skills.read")).toEqual(["skills.read"]);
	});

	test("apis.all 展开为全部 14 个权限", () => {
		expect(getPermissionsForScope("apis.all").length).toBe(14);
	});

	test("未知 scope 返回空数组，不抛错", () => {
		// @ts-expect-error 故意传非法值，测试运行时容错
		expect(getPermissionsForScope("unknown.read")).toEqual([]);
	});
});

// 资源 → 该资源的 read/write scope 列表，供前端渲染勾选表
describe("getScopesForResource", () => {
	test("每个资源恰好有 read、write 两个 scope", () => {
		const scopes = getScopesForResource("skills");
		expect(scopes).toHaveLength(2);
		expect(scopes.map((s) => s.type)).toEqual(["read", "write"]);
	});
});

// scopes 数组 → 实际权限集合（鉴权热路径）
describe("mapScopesToPermissions", () => {
	test("多个 scope 合并展开，去重后保留全部", () => {
		const result = mapScopesToPermissions(["promptRecord.write", "skills.read"]);
		expect(result).toEqual(["promptRecord.write", "promptRecord.read", "skills.read"]);
	});

	test("apis.read 展开为全部 7 个只读权限", () => {
		expect(mapScopesToPermissions(["apis.read"])).toHaveLength(7);
	});
});

// scopes → 预设名（编辑已有 key 时高亮按钮用）
describe("scopesToName", () => {
	test("含 apis.all → 全部", () => {
		expect(scopesToName(["apis.all"]).name).toBe("全部");
	});

	test("含 apis.read → 只读", () => {
		expect(scopesToName(["apis.read"]).name).toBe("只读");
	});

	test("仅资源级 scope → 限制", () => {
		expect(scopesToName(["promptRecord.read", "skills.read"]).name).toBe("限制");
	});
});

// 合并去重：同资源同时有 read 和 write 时只保留 write
describe("consolidateScopes", () => {
	test("read 被 write 吞掉", () => {
		expect(consolidateScopes(["promptRecord.read", "promptRecord.write", "skills.read"])).toEqual([
			"promptRecord.write",
			"skills.read",
		]);
	});

	test("无冲突时原样返回", () => {
		expect(consolidateScopes(["skills.read", "agents.write"])).toEqual([
			"skills.read",
			"agents.write",
		]);
	});
});

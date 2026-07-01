import { describe, expect, test } from "vitest";

import {
  SCOPES,
  consolidateScopes,
  getPermissionsForScope,
  getScopesForResource,
  getScopesForRole,
  mapScopesToPermissions,
  scopesToName,
  validateScopesForRole,
} from "./scopes";

// 户口本：登记的 scope 数量应与权威表一致，新增 scope 时两处需同步
describe("SCOPES 户口本", () => {
  test("包含全部 16 个合法 scope", () => {
    expect(SCOPES.length).toBe(16);
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

  test("所有资源级 scope 都不含 guest 角色（游客不能创建 key）", () => {
    const scopes = getScopesForResource("skills");
    scopes.forEach((s) => {
      expect(s.roles).not.toContain("guest");
    });
  });
});

// 角色 → 可授予的全部 scope
describe("getScopesForRole", () => {
  test("user 可授予全部 16 个 scope", () => {
    expect(getScopesForRole("user")).toHaveLength(16);
  });

  test("guest 可授予 0 个（无权创建 key）", () => {
    expect(getScopesForRole("guest")).toEqual([]);
  });

  test("member 可授予全部 16 个 scope", () => {
    expect(getScopesForRole("member")).toHaveLength(16);
  });
});

// scopes 数组 → 实际权限集合（鉴权热路径）
describe("mapScopesToPermissions", () => {
  test("多个 scope 合并展开，去重后保留全部", () => {
    const result = mapScopesToPermissions([
      "promptRecord.write",
      "skills.read",
    ]);
    expect(result).toEqual([
      "promptRecord.write",
      "promptRecord.read",
      "skills.read",
    ]);
  });

  test("apis.read 展开为全部 7 个只读权限", () => {
    expect(mapScopesToPermissions(["apis.read"])).toHaveLength(7);
  });
});

// 校验角色是否可授予这些 scope，防止越权
describe("validateScopesForRole", () => {
  test("user 授予 write scope 合法", () => {
    expect(validateScopesForRole(["promptRecord.write"], "user")).toBe(true);
  });

  test("guest 授予任何 scope 都非法", () => {
    expect(validateScopesForRole(["apis.all"], "guest")).toBe(false);
    expect(validateScopesForRole(["promptRecord.read"], "guest")).toBe(false);
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
    expect(scopesToName(["promptRecord.read", "skills.read"]).name).toBe(
      "限制",
    );
  });
});

// 合并去重：同资源同时有 read 和 write 时只保留 write
describe("consolidateScopes", () => {
  test("read 被 write 吞掉", () => {
    expect(
      consolidateScopes([
        "promptRecord.read",
        "promptRecord.write",
        "skills.read",
      ]),
    ).toEqual(["promptRecord.write", "skills.read"]);
  });

  test("无冲突时原样返回", () => {
    expect(consolidateScopes(["skills.read", "agents.write"])).toEqual([
      "skills.read",
      "agents.write",
    ]);
  });
});

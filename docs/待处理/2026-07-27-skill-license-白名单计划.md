# Skill License 白名单计划

## 背景

同步管线把 frontmatter 里任意字符串当有效协议，只要 license 非空就存 SKILL.md 全文。实测库里 223 条非标准 SPDX 条目存了全文，其中 15 条明确 Proprietary（Anthropic 官方文档 skills 及其复制品），属实际侵权风险。

问题代码：`src/server/domain/discover/skills/services/import-github.ts` 的 `normalizeLicense`（只挡 `NOASSERTION`，黑名单思路）。

## 方案

改成白名单思路：不在白名单 → 视为无有效协议 → 只存元数据+回链，`content` 置 null。

1. **白名单**（允许转载全文的标准 SPDX id）：

   `MIT` `MIT-0` `Apache-2.0` `BSD-2-Clause` `BSD-3-Clause` `ISC` `MPL-2.0` `Unlicense` `CC0-1.0` `CC-BY-4.0` `CC-BY-SA-4.0` `GPL-2.0` `GPL-3.0` `AGPL-3.0` `LGPL-3.0`（含 `-only` / `-or-later` 变体）

2. **宽松归一**：匹配前做规整（去掉 "license" 后缀、大小写、常见别名），如 `MIT license` → `MIT`、`GPLv3 license` → `GPL-3.0`；归一失败 → 回落仓库 license → 仍失败按无协议处理。

3. **存量清洗**：一次性脚本，license 归一后仍不在白名单的行 `content` 置 null（license 原值保留，信息不丢）。

## 验收

- 清洗后查询「license 不在白名单 且 content 非空」的行数 = 0
- 15 条 Proprietary 条目降级为元数据卡片，回链可跳原仓库

## 后续可选

- 详情页明示协议标识 + 链接原仓库 LICENSE（MIT/Apache 署名义务）
- 若做「导入广场 skill 并修改」功能，GPL/AGPL/CC-BY-SA 衍生内容需沿用原协议

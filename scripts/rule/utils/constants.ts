// # 规约测试脚本共享常量：用户 ID、资源类型、色盘、数量与日期基线

import { FOLDER_PRESET_COLORS } from "@/features/folder-combobox/config/folder-colors";
import { TAG_PRESET_COLORS } from "@/features/tag-combobox/config/tag-colors";
import { SPACE_PRESET_COLORS } from "@/pages/spec/personal/rules/ui/rule-space-combobox/config/space-icons";

// 模拟当前用户在数据库中的 ID（与 scripts/db/* 共用同一个测试用户）
export const OWNER_ID = "cmrjdu92f0001099de7h2zu5p";

// 规约资源类型标识：文件夹、标签、规则三侧保持一致，用于按资源隔离查询与清理
export const RESOURCE_TYPE = "rules" as const;

// @ 数量配置：每个测试实体的生成数量，数量本身也是测试覆盖的一部分
export const SPACE_COUNT = 8;
export const FOLDER_COUNT = 21;
export const TAG_COUNT = 24;
export const RULE_COUNT = 120;
// 超长正文规则条数（每条对应一个主题生成器）
export const LONG_CONTENT_COUNT = 5;
// 超长正文目标字符数（三万到四万区间，逼近 content 上限 10 万但留足余量）
export const LONG_CONTENT_TARGET = 35000;

// @ 色盘：复用前端预设色，保证测试数据与真实数据视觉一致
export const SPACE_COLORS = SPACE_PRESET_COLORS;
export const FOLDER_COLORS = FOLDER_PRESET_COLORS;
export const TAG_COLORS = TAG_PRESET_COLORS;

// 日期基线：所有测试数据时间从这天起按索引递增，避免时间集中影响排序测试
export const BASE_DATE = new Date(2026, 6, 10, 9, 0, 0, 0);

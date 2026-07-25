// # 编辑器偏好的 zod schema：校验 localStorage 反序列化结果，脏数据/版本迁移时回退默认
// > 从 config 派生合法值集合（单一真相），加主题/工具只改 config，schema 自动跟上

import { z } from "@/shared/lib/zod";
import { defaultEditorSettings, EDITOR_THEMES, TOOL_IDS } from "../config/editor";

// 编辑器显示设置：三个布尔开关，结构演进时多余字段会被 .strip 丢弃、缺失字段回退默认
// store merge 时校验 localStorage 读出的 editorSettings；非法（手改/旧版本/损坏）整体回退默认
export const editorSettingsSchema = z
	.object({
		// 显示行号开关；对应 CodeMirror basicSetup.lineNumbers
		lineNumbers: z.boolean(),
		// 显示代码折叠按钮开关；对应 CodeMirror basicSetup.foldGutter
		foldGutter: z.boolean(),
		// 高亮当前光标行开关；对应 CodeMirror basicSetup.highlightActiveLine
		highlightActiveLine: z.boolean(),
	})
	// parse 失败时回退默认（三个全 false）；带默认值所以 .parse() 永不抛错
	.default(defaultEditorSettings);

// 主题 id：必须命中 EDITOR_THEMES 里的某个；非法（旧版本残留/手改）回退 vscode
export const editorThemeIdSchema = z
	.string()
	.refine((id) => EDITOR_THEMES.some((t) => t.id === id), {
		error: "未知的编辑器主题",
	})
	.default("vscode");

// 快捷栏工具配置：id 数组，每个必须命中 TOOL_IDS；非法项被过滤，全空回退默认
export const activeToolsSchema = z.array(z.enum(TOOL_IDS)).default([...TOOL_IDS]);

// > 安全校验：parse 失败一律回退 schema 内置默认值，绝不向编辑器喂脏数据
export const safeParseEditorSettings = (raw: unknown) =>
	editorSettingsSchema.parse(raw ?? defaultEditorSettings);
export const safeParseEditorThemeId = (raw: unknown) => editorThemeIdSchema.parse(raw ?? "vscode");
export const safeParseActiveTools = (raw: unknown) => activeToolsSchema.parse(raw ?? [...TOOL_IDS]);

// # 编辑器状态 store（zustand + persist）：偏好 + 运行态 + action
// > 独立于组件存在，ME/QT 各自 useStore 订阅；编排层不碰状态
// > 边界 B：只装数据 + action，editorRef（DOM 引用）不进 store（用 forwardRef 传）
// > persist 只持久化偏好（settings/theme/activeTools），运行态（isPreview/activeFormats）不存

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { defaultEditorSettings, TOOL_IDS } from "../config/editor";
import {
	activeToolsSchema,
	editorSettingsSchema,
	editorThemeIdSchema,
} from "../lib/editor-prefs-schema";

type EditorSettings = typeof defaultEditorSettings;

type EditorState = {
	// @ 偏好（persist 持久化到 localStorage，刷新不丢）

	// [持久化] CodeMirror 显示开关（行号/折叠/高亮当前行）；ME 读（应用为 basicSetup）、QT 读（菜单激活态）、toggleDisplay 写
	editorSettings: EditorSettings;
	// [持久化] 当前主题 id（github/vscode/xcode/...）；QT 读（主题菜单打勾）、resolveEditorColors 读（派生配色）、setEditorThemeId 写
	editorThemeId: string;
	// [持久化] 已加入快捷胶囊栏的工具 id 列表（bold/italic/...）；只 QT 读（渲染胶囊）、toggleTool/reorderTools 写
	activeTools: string[];

	// @ 运行态（不持久化，刷新即失；创建模式保存后由 resetView 重置）

	// [内存] 是否 Markdown 预览模式；ME 读（切编辑/预览视图）、QT 读（过滤菜单项+高亮预览按钮）、togglePreview 写
	isPreview: boolean;
	// [内存] 光标处生效的格式 id 集合（bold/italic/...）；只 QT 读（按钮高亮）、ME 的 onUpdate 经 resolveActiveFormats 算后写
	activeFormats: Set<string>;

	// @ actions（修改状态的方法，不持久化）

	// 切换主题；QT 主题菜单 onClick 调用
	setEditorThemeId: (id: string) => void;
	// 切显示设置开关（lineNumbers/foldGutter/highlightActiveLine）；QT 点点点菜单 display 项调用
	toggleDisplay: (id: string) => void;
	// 切预览模式（编辑↔预览）；QT 点点点菜单 preview 项调用
	togglePreview: () => void;
	// 切某工具是否在快捷栏；QT 点点点菜单 Checkbox（增删快捷项）调用
	toggleTool: (id: string) => void;
	// 拖拽排序后的新顺序（不可见项追加末尾）；QT 胶囊栏 onReorder 调用
	reorderTools: (newOrder: string[]) => void;
	// 写光标格式高亮集合；ME 的 onUpdate 回调内调用（resolveActiveFormats 算完后写入）
	setActiveFormats: (formats: Set<string>) => void;
	// 重置运行态（isPreview=false、activeFormats=空）；编排层创建模式保存成功后调用，让下次打开是干净状态
	resetView: () => void;
};

// > 编辑器状态 store：偏好 persist 到 localStorage，运行态每次会话重置
export const useEditorStore = create<EditorState>()(
	persist(
		(set) => ({
			editorSettings: defaultEditorSettings,
			editorThemeId: "vscode",
			activeTools: [...TOOL_IDS],
			isPreview: false,
			activeFormats: new Set(),

			setEditorThemeId: (id) => set({ editorThemeId: id }),
			toggleDisplay: (id) =>
				set((state) => ({
					editorSettings: {
						...state.editorSettings,
						[id]: !state.editorSettings[id as keyof EditorSettings],
					},
				})),
			togglePreview: () => set((state) => ({ isPreview: !state.isPreview })),
			toggleTool: (id) =>
				set((state) => {
					const tools = state.activeTools;
					return {
						activeTools: tools.includes(id) ? tools.filter((t) => t !== id) : [...tools, id],
					};
				}),
			reorderTools: (newOrder) =>
				set((state) => ({
					activeTools: state.activeTools.slice().sort((a, b) => {
						const ia = newOrder.indexOf(a);
						const ib = newOrder.indexOf(b);
						if (ia === -1 && ib === -1) return 0;
						if (ia === -1) return 1;
						if (ib === -1) return -1;
						return ia - ib;
					}),
				})),
			setActiveFormats: (formats) => set({ activeFormats: formats }),
			resetView: () => set({ isPreview: false, activeFormats: new Set() }),
		}),
		{
			name: "prompt-workspace.editor-state",
			// 只持久化偏好，运行态每次会话重置
			partialize: (state) => ({
				editorSettings: state.editorSettings,
				editorThemeId: state.editorThemeId,
				activeTools: state.activeTools,
			}),
			// 反序列化时用 zod 校验，脏数据/版本迁移回退默认
			merge: (persisted, current) => {
				const raw = (persisted ?? {}) as Partial<EditorState>;
				return {
					...current,
					editorSettings: editorSettingsSchema.parse(raw.editorSettings ?? defaultEditorSettings),
					editorThemeId: editorThemeIdSchema.parse(raw.editorThemeId ?? "vscode"),
					activeTools: activeToolsSchema.parse(raw.activeTools ?? [...TOOL_IDS]),
				};
			},
		},
	),
);

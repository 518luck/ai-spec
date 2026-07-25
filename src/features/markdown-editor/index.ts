// # markdown-editor：可复用的 markdown 编辑器能力层
// > 编排层直接用 MarkdownEditor + QuickToolbar，无需 Provider；编辑器状态独立于 useEditorStore
// > editorRef 是 DOM 句柄，由编排层持有并传给 ME（挂 CodeMirror）+ QT（执行格式化），不进 store

// config 里的编辑器配置/工具（主题表、菜单组、格式执行等）
export {
	defaultEditorSettings,
	EDITOR_THEMES,
	executeFormat,
	MENU_GROUPS,
	NODE_NAME_TO_TOOL_ID,
	type ToolId,
} from "./config/editor";
// 派生色工具：从主题 id + 系统明暗算 CodeMirror 主题对象与背景色
export { resolveEditorColors } from "./lib/editor-colors";
// 纯函数：编排层算标题、算光标格式高亮用
export { extractTitle } from "./lib/extract-title";
export { resolveActiveFormats } from "./lib/resolve-active-formats";
// 编辑器状态 store（zustand + persist）：编排层/ME/QT 各自 useEditorStore 订阅
export { useEditorStore } from "./model/editor-store";

// 编辑器组件：MarkdownEditor（编辑+预览一体）、QuickToolbar（快捷栏）、MarkdownPreview（纯预览，备未来）
export { MarkdownEditor } from "./ui/markdown-editor";
export { MarkdownPreview } from "./ui/markdown-preview";
export { QuickToolbar } from "./ui/quick-toolbar";

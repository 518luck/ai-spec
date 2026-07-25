// # 菜单项激活判断：根据分组类型，用各自的数据源判断该项当前是否激活（用于高亮显示）

import type { MenuGroup, MenuItem } from "../config/editor";

// 显示设置子集：仅声明 isItemActive 真正读取的字段，避免反向依赖 ui 层的完整 EditorState
type DisplaySettings = {
	lineNumbers: boolean;
	foldGutter: boolean;
	highlightActiveLine: boolean;
};

type IsItemActiveOptions = {
	// 菜单项所属分组
	group: MenuGroup;
	// 待判断的菜单项
	item: MenuItem;
	// 光标位置正在使用的格式 id 集合（tool 组用）
	activeFormats: Set<string>;
	// 编辑器视图设置开关（display 组用）
	editorSettings: DisplaySettings;
	// 是否处于预览模式（preview 组用）
	isPreview: boolean;
};

// > 判断菜单项是否激活：tool 组看选区格式，display 组看显示设置开关，preview 组看全局模式
export const isItemActive = ({
	group,
	item,
	activeFormats,
	editorSettings,
	isPreview,
}: IsItemActiveOptions): boolean => {
	if (group.type === "tool") return activeFormats.has(item.id);
	if (group.type === "display") {
		return Boolean(editorSettings[item.id as keyof typeof editorSettings]);
	}
	if (group.type === "preview") return isPreview;
	return false;
};

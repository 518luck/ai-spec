// # 标签预设颜色盘：紫粉青蓝等区别于文件夹的色相，避免与文件夹颜色视觉混淆

// 预设色：覆盖常见分类色相，供标签创建时快捷选择
export const TAG_PRESET_COLORS = [
	"#8b5cf6", // 紫
	"#ec4899", // 粉
	"#06b6d4", // 青
	"#3b82f6", // 蓝
	"#10b981", // 绿
	"#f59e0b", // 橙
] as const;

// 默认颜色：紫色（创建时预选，与 DB @default 的中性灰区分开，让新建标签更有识别度）
export const TAG_DEFAULT_COLOR = TAG_PRESET_COLORS[0];

// 中性灰：用于「新建标签」操作图标、未上色场景（与 DB @default 一致）
export const TAG_NEUTRAL_COLOR = "#9ca3af";

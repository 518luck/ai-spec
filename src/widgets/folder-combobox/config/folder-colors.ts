// # 文件夹预设颜色盘：红橙黄绿蓝，均为 #RRGGBB 格式（对齐 folderColorSchema）

// 预设色：覆盖常见分类色相，供文件夹创建/编辑时快捷选择
export const FOLDER_PRESET_COLORS = [
	"#ef4444", // 红
	"#f59e0b", // 橙
	"#eab308", // 黄
	"#10b981", // 绿
	"#3b82f6", // 蓝
] as const;

// 默认颜色：红色（创建时预选，与 DB @default 一致）
export const FOLDER_DEFAULT_COLOR = FOLDER_PRESET_COLORS[0];

// 中性灰：用于「未分类」项、「创建文件夹」操作图标等非具体文件夹场景
export const FOLDER_NEUTRAL_COLOR = "#9ca3af";

// # 文件夹预设颜色盘：红橙黄绿蓝，均为 #RRGGBB 格式（对齐 folderColorSchema）

// 预设色：覆盖常见分类色相，供文件夹创建/编辑时快捷选择
export const FOLDER_PRESET_COLORS = [
	"#ef4444", // 红
	"#f59e0b", // 橙
	"#eab308", // 黄
	"#10b981", // 绿
	"#3b82f6", // 蓝
] as const;

// 默认颜色：蓝色（首次创建时选中）
export const FOLDER_DEFAULT_COLOR = FOLDER_PRESET_COLORS[0];

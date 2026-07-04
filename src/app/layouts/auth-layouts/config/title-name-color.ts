export type TitleNameColorPreset = {
	glowColor: string;
	baseHue: number;
	hueRange: number;
};

export const TITLE_NAME_COLOR_PRESETS = {
	coolGraphiteSilver: {
		// 冷石墨银：偏冷的银灰蓝，理性、克制、现代
		glowColor: "rgba(148, 153, 160, 0.8)",
		baseHue: 210,
		hueRange: 10,
	},
	graphiteSage: {
		// 石墨鼠尾草：灰调鼠尾草绿，低饱和、自然、安静
		glowColor: "rgba(132, 141, 129, 0.01)",
		baseHue: 96,
		hueRange: 10,
	},
	dustyPlum: {
		// 灰调梅子紫：带灰度的暗梅子紫，柔和、克制、稍带艺术感
		glowColor: "rgba(136, 126, 146, 0.16)",
		baseHue: 278,
		hueRange: 10,
	},
} satisfies Record<string, TitleNameColorPreset>;

export const TITLE_NAME_COLOR = TITLE_NAME_COLOR_PRESETS.coolGraphiteSilver;

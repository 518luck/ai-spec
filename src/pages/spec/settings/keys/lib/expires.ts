import dayjs from "dayjs";

import type { ExpiryPresetValue } from "../ui/key-form-fields";

// 把弹窗选的过期预设/日期换算成后端接受的 ISO 字符串；null 表示永不过期
export const computeExpires = (preset: ExpiryPresetValue, date?: Date): string | null => {
	switch (preset) {
		case "never":
			return null;
		case "7d":
			return dayjs().add(7, "day").toISOString();
		case "30d":
			return dayjs().add(30, "day").toISOString();
		case "90d":
			return dayjs().add(90, "day").toISOString();
		case "custom":
			return date ? date.toISOString() : null;
	}
};

// 1 天的毫秒数，供 formatExpires 计算剩余天数
const DAY_MS = 24 * 60 * 60 * 1000;

// 把过期时间格式化为列表展示文案：null=永久，已过期=已过期，未过期按剩余天数展示（创建时只按天选，不存在更小单位）
export const formatExpires = (expires: Date | null): string => {
	if (!expires) return "永久";
	const remaining = expires.getTime() - Date.now();
	if (remaining <= 0) return "已过期";
	// 创建弹窗的预设是 7/30/90 天，自定义按日选，语义上最小粒度就是天；不足 1 天统一显示「不足 1 天」
	if (remaining < DAY_MS) return "不足 1 天";
	return `${Math.floor(remaining / DAY_MS)} 天`;
};

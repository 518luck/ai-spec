// # 相对时间格式化：把 ISO 字符串翻成中文「刚刚 / X分钟前 / 昨天 / MM-DD」

import dayjs from "dayjs";

// 相对时间的各档阈值（毫秒）
const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

// > 近期用相对时间（刚刚→分钟→小时→昨天→X天前），超 7 天退化成 MM-DD 绝对日期
export const formatRelativeTime = (iso: string): string => {
	const diff = Date.now() - new Date(iso).getTime();
	if (diff < MINUTE) return "刚刚";
	if (diff < HOUR) return `${Math.floor(diff / MINUTE)}分钟前`;
	if (diff < DAY) return `${Math.floor(diff / HOUR)}小时前`;
	if (diff < 2 * DAY) return "昨天";
	if (diff < 7 * DAY) return `${Math.floor(diff / DAY)}天前`;
	// 超过一周：相对时间区分度太低，直接给精确日期
	return dayjs(iso).format("MM-DD");
};

import dayjs from "dayjs";
import "dayjs/locale/zh-cn";
import relativeTime from "dayjs/plugin/relativeTime";

import { FALLBACK_TITLE_LENGTH, PREVIEW_MAX_LINES } from "../config/constants";

// 初始化 dayjs 中文相对时间插件，仅执行一次
dayjs.extend(relativeTime);
dayjs.locale("zh-cn");

// 把时间格式化为中文相对时间（如"3 分钟前""2 天前"），超过 30 天回退到日期
export const formatRelativeTime = (date: Date): string => {
	const diffDays = dayjs().diff(dayjs(date), "day");
	if (diffDays > 30) {
		return dayjs(date).format("YYYY-MM-DD");
	}
	return dayjs(date).fromNow();
};

// 草稿无标题时，用内容前 N 个字符生成展示标题
export const getDraftTitle = (name: string | null, content: string): string => {
	if (name?.trim()) return name.trim();
	const text = content.trim().replace(/\s+/g, " ");
	return text.length > FALLBACK_TITLE_LENGTH
		? `${text.slice(0, FALLBACK_TITLE_LENGTH)}…`
		: text || "无内容草稿";
};

// 把草稿正文按行截断为预览文本，超出最大行数时末尾加省略号
export const truncateContent = (content: string): string => {
	const lines = content.split("\n");
	if (lines.length <= PREVIEW_MAX_LINES) return content;
	return `${lines.slice(0, PREVIEW_MAX_LINES).join("\n")}…`;
};

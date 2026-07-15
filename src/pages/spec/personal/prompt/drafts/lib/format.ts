import { FALLBACK_TITLE_LENGTH, PREVIEW_MAX_LINES } from "../config/draft-list";

// # 草稿展示格式化工具：标题回退、内容截断

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

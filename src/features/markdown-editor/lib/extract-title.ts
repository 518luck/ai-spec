// # 从内容中提取第一个非空行作为标题；全为空白时返回 undefined（由调用方兜底）

export const extractTitle = (content: string): string | undefined => {
	for (const line of content.split("\n")) {
		const trimmed = line.trim();
		if (trimmed) return trimmed;
	}
	return undefined;
};

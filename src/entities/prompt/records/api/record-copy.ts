// # 收录 API：记录一次复制使用（best-effort，统计失败不影响用户复制体验）

// > 记录一次复制使用：fire-and-forget 调用，所有错误静默吞掉
// ! 不抛错：统计是次要功能，绝不能让「记数失败」影响用户复制体验
export const recordCopy = async (id: string): Promise<void> => {
	try {
		await fetch(`/api/prompt/records/${id}/copies`, { method: "POST" });
	} catch {
		// 网络错误静默
	}
};

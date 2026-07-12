// # 统一错误解析：从错误响应中提取后端统一错误体 { error: { message } }

// > 非 JSON 或无 message 时返回空串，交由调用方决定最终文案（不要在这里抛错）
export const resolveErrorMessage = async (response: Response): Promise<string> => {
	try {
		const body = (await response.json()) as { error?: { message?: unknown } };
		if (typeof body.error?.message === "string" && body.error.message) {
			return body.error.message;
		}
	} catch {
		// 非 JSON 响应（网关错误页等），返回空串交由调用方兜底
	}
	return "";
};

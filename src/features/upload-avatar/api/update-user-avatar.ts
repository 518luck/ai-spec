// 提交头像 dataUrl 到 PATCH /api/user，非 2xx 时解析后端错误体并抛出
export const updateUserAvatar = async (avatar: string): Promise<void> => {
  const response = await fetch("/api/user", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ avatar }),
  });

  if (!response.ok) {
    throw new Error(await resolveErrorMessage(response));
  }
};

// 从错误响应中解析后端统一错误体 { error: { message } }，解析失败回退到通用文案
const resolveErrorMessage = async (response: Response): Promise<string> => {
  const fallback = "头像更新失败，请稍后重试";
  try {
    const body = (await response.json()) as { error?: { message?: unknown } };
    const message = body?.error?.message;
    if (typeof message === "string" && message.length > 0) {
      return message;
    }
  } catch {
    // 响应体非 JSON（如网关错误页），使用兜底文案
  }
  return fallback;
};

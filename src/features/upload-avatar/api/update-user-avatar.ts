// 提交头像 dataUrl 到 PATCH /api/user，非 2xx 抛错由调用方处理
export const updateUserAvatar = async (avatar: string): Promise<void> => {
  const response = await fetch("/api/user", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ avatar }),
  });

  if (!response.ok) {
    throw new Error("头像更新失败，请稍后重试");
  }
};

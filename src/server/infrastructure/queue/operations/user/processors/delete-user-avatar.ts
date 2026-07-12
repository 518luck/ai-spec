import { getS3StorageClient } from "@/server/infrastructure/storage";

import type { DeleteUserAvatarData } from "../types";

// # 处理器：删除用户旧头像

// 删除用户旧头像：从 URL 反解 key 后调用 S3 删除；非自有桶资源静默跳过
// > 可安全重试：key 解析失败或资源已删都直接返回，保证幂等
export async function processDeleteUserAvatar({ avatarUrl }: DeleteUserAvatarData): Promise<void> {
	const client = getS3StorageClient();
	const key = client.parseKeyFromUrl(avatarUrl);
	if (!key) {
		return;
	}

	await client.delete({ key });
}

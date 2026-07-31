// # 记录一次复制使用：原子自增 copy_count + 刷新 last_copied_at
// ! 不校验归属：WHERE 命中 0 行静默无副作用（用户能拿到 record_id 说明已通过 GET 鉴权）
// ! copy_count 用于权重，last_copied_at 驱动 HN 幂律衰减

import prisma from "@/shared/db";

export const copyRecord = async ({
	recordId,
}: {
	recordId: string;
}): Promise<{ success: boolean }> => {
	await prisma.promptRecord.updateMany({
		where: { id: recordId },
		data: {
			copyCount: { increment: 1 },
			lastCopiedAt: new Date(),
		},
	});

	return { success: true };
};

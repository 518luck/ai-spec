// # 更新当前登录用户资料：name 直接写库；avatar 上传 S3 + 事后清理旧图；email 走验证邮件
// > 从 app/api/user/route.ts 抽出，供 oRPC procedure 复用
//
// ! email 改动走验证邮件流程，不在本接口直接写库；真正写库由 confirm-email-change 页面完成
// ! 旧头像清理为 best-effort：enqueue 失败不得让接口 500，仅记录 warn 日志

import { AiSpecError } from "@/server/errors/http-error";
import { createLogger, serializeError } from "@/server/infrastructure/axiom/server";
import { enqueueDeleteUserAvatar } from "@/server/infrastructure/queue";
import { uploadUserAvatar } from "@/server/infrastructure/storage";
import prisma from "@/shared/db";
import { requestEmailChange } from "@/shared/lib/auth/request-email-change";
import { ErrorCode } from "@/shared/lib/zod/schemas/error";
import type { UserVo } from "@/shared/lib/zod/schemas/user";

// 用户领域 service 的专用日志作用域，自动注入 module 字段
const log = createLogger("user-service");

// update 的部分更新字段（与 updateUserDtoSchema 对齐，已由 zod 校验保证类型）
type UpdatePatch = {
	name?: string;
	email?: string;
	avatar?: string;
	defaultWorkspace?: string;
};

export const updateUser = async ({
	userId,
	currentEmail,
	patch,
}: {
	userId: string;
	currentEmail: string;
	patch: UpdatePatch;
}): Promise<UserVo> => {
	const { name, email, avatar, defaultWorkspace } = patch;
	const data: { name?: string; image?: string } = {};

	if (name !== undefined) {
		data.name = name;
	}

	// 更新头像前先读旧 image，用于事后清理 S3 中的旧文件
	let previousImage: string | null = null;
	if (avatar !== undefined) {
		const current = await prisma.user.findUnique({
			where: { id: userId },
			select: { image: true },
		});
		previousImage = current?.image ?? null;

		// 上传头像到对象存储（key 带随机后缀做缓存刷新），返回的 URL 写入用户表
		data.image = await uploadUserAvatar({ userId, body: avatar });
	}

	// email 走验证流程：先查重，再给新邮箱发确认邮件
	if (email !== undefined) {
		// 改成自己当前邮箱时跳过，避免无谓发确认邮件并消耗限流额度
		if (email !== currentEmail) {
			const taken = await prisma.user.findFirst({
				where: { email, NOT: { id: userId } },
				select: { id: true },
			});
			if (taken) {
				throw new AiSpecError({
					code: ErrorCode.CONFLICT,
					message: "该邮箱已被其他账号使用",
				});
			}
			// 给新邮箱发确认邮件，不直接写库
			await requestEmailChange({
				oldEmail: currentEmail,
				newEmail: email,
				userId,
			});
		}
	}

	// TODO: defaultWorkspace 等工作空间功能上线后实现，当前校验通过但不写库
	void defaultWorkspace;

	const updated = await prisma.user.update({
		where: { id: userId },
		data,
		select: { id: true, name: true, email: true, image: true },
	});

	// DB 写入成功后 best-effort 入队清理旧头像；enqueue 失败不得让接口 500
	if (previousImage) {
		await enqueueDeleteUserAvatar({
			userId,
			avatarUrl: previousImage,
		}).catch((error) => {
			log.warn("入队旧头像清理任务失败", {
				userId,
				...(error instanceof Error ? serializeError(error) : { error: String(error) }),
			});
		});
	}

	// DB 列 name 可空，但 userVoSchema.name 为非空 string；null 收敛为空串（用户均经 OAuth 建号带 name，作防御兜底）
	return { ...updated, name: updated.name ?? "" };
};

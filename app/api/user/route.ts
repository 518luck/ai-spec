import { NextResponse } from "next/server";
import { AiSpecError } from "@/server/errors/http-error";
import { createLogger, serializeError } from "@/server/infrastructure/axiom/server";
import { enqueueDeleteUserAvatar } from "@/server/infrastructure/queue";
import { uploadUserAvatar } from "@/server/infrastructure/storage";
import { withSession } from "@/server/middleware/with-session";
import prisma from "@/shared/db";
import { requestEmailChange } from "@/shared/lib/auth/request-email-change";
import { updateUserSchema } from "@/shared/lib/zod/schemas/user";

// 用户资料更新路由的专用日志作用域，自动注入 module 字段
const log = createLogger("user-route");

// # 当前登录用户资料更新（name / avatar / email / defaultWorkspace）

// ! email 改动走验证邮件流程，不在本接口直接写库；真正写库由 confirm-email-change 页面完成
export const PATCH = withSession(async ({ req, session }) => {
	const parsed = updateUserSchema.safeParse(await req.json());
	if (!parsed.success) {
		throw parsed.error;
	}
	const { name, email, avatar, defaultWorkspace } = parsed.data;

	const userId = session.user.id;
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
		const currentEmail = session.user.email ?? "";
		// 改成自己当前邮箱时跳过，避免无谓发确认邮件并消耗限流额度
		if (email !== currentEmail) {
			const taken = await prisma.user.findFirst({
				where: { email, NOT: { id: userId } },
				select: { id: true },
			});
			if (taken) {
				throw new AiSpecError({
					code: "CONFLICT",
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
			log.error("入队旧头像清理任务失败", {
				userId,
				...(error instanceof Error ? serializeError(error) : { error: String(error) }),
			});
		});
	}

	return NextResponse.json(updated);
});

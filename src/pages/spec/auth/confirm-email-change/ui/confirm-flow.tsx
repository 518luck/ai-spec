import { redirect } from "next/navigation";
import type { JSX } from "react";
import { enqueueEmailChangedNotice } from "@/server/infrastructure/queue";
import { kvDel } from "@/server/infrastructure/redis/kv";
import prisma from "@/shared/db";
import { auth } from "@/shared/lib/auth/auth";
import { resolveEmailChangeToken } from "@/shared/lib/auth/resolve-email-change";
import { ConfirmEmailChangeClient } from "./confirm-client";
import { StatusMessage } from "./status-message";

type ConfirmEmailChangeFlowProps = {
	token: string;
	isCancel: boolean;
};

// # 邮箱变更确认服务端流程：校验 token → 取消/确认分支 → 更新邮箱 → 清理 → 通知老邮箱
export async function ConfirmEmailChangeFlow({
	token,
	isCancel,
}: ConfirmEmailChangeFlowProps): Promise<JSX.Element> {
	const resolved = await resolveEmailChangeToken(token);

	if (!resolved) {
		return (
			<StatusMessage
				title="链接无效或已过期"
				description="该验证链接不存在或已失效，请重新发起邮箱变更。"
			/>
		);
	}

	// 取消分支：作废本次变更，清理 token 与 Redis 上下文后停留展示
	if (isCancel) {
		await prisma.verificationToken.delete({
			where: {
				identifier_token: {
					identifier: resolved.record.identifier,
					token: resolved.record.token,
				},
			},
		});
		await kvDel(`email-change:${resolved.record.token}`);

		return (
			<StatusMessage
				title="邮箱变更已取消"
				description="本次邮箱变更请求已作废，账户邮箱未发生改变。"
			/>
		);
	}

	// 确认分支：必须登录后才能变更
	const session = await auth();
	const userId = session?.user?.id;
	if (!userId) {
		redirect(`/spec/login?next=${encodeURIComponent(`/spec/confirm-email-change/${token}`)}`);
	}

	// > 归属一致：只有发起变更的账号本人才能确认
	if (resolved.context.userId !== userId) {
		return (
			<StatusMessage
				title="无权确认此变更"
				description="该验证链接不属于当前登录账号，请使用发起变更的账号登录后重试。"
			/>
		);
	}

	// ! 写库前再查一次新邮箱是否被占用，防止并发竞态
	const taken = await prisma.user.findFirst({
		where: { email: resolved.context.newEmail, NOT: { id: userId } },
		select: { id: true },
	});
	if (taken) {
		return (
			<StatusMessage title="邮箱已被占用" description="该邮箱已被其他账号使用，邮箱变更未完成。" />
		);
	}

	await prisma.user.update({
		where: { id: userId },
		data: {
			email: resolved.context.newEmail,
			emailVerified: new Date(),
		},
	});

	// 清理已消费的 token 与 Redis 上下文，使链接不可重复使用
	await prisma.verificationToken.delete({
		where: {
			identifier_token: {
				identifier: resolved.record.identifier,
				token: resolved.record.token,
			},
		},
	});
	await kvDel(`email-change:${resolved.record.token}`);

	// 异步通知老邮箱地址已变更，防止非本人操作时用户不知情
	await enqueueEmailChangedNotice({
		to: resolved.context.oldEmail,
		newEmail: resolved.context.newEmail,
	});

	return <ConfirmEmailChangeClient />;
}

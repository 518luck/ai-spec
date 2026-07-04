import "server-only";

import prisma from "@/shared/db";
import { kvGet } from "@/shared/lib/infrastructure/redis/kv";
import { hashToken } from "./hash-token";

// 邮箱变更上下文：与 request-email-change 写入 Redis 的结构保持一致
type EmailChangeContext = {
	oldEmail: string;
	newEmail: string;
	userId: string;
};

// resolveEmailChangeToken 的成功返回：DB 验证记录与 Redis 上下文
type ResolvedEmailChangeToken = {
	record: {
		identifier: string;
		token: string;
		expires: Date;
	};
	context: EmailChangeContext;
};

// 用原始 token 哈希后查 DB 验证记录与 Redis 上下文，token 缺失/过期/无上下文时返回 null
export const resolveEmailChangeToken = async (
	rawToken: string,
): Promise<ResolvedEmailChangeToken | null> => {
	const hashed = await hashToken(rawToken);

	const record = await prisma.verificationToken.findFirst({
		where: { token: hashed },
		select: { identifier: true, token: true, expires: true },
	});

	if (!record) {
		return null;
	}

	if (record.expires && record.expires < new Date()) {
		return null;
	}

	const context = await kvGet<EmailChangeContext>(`email-change:${hashed}`);
	if (!context) {
		return null;
	}

	return { record, context };
};

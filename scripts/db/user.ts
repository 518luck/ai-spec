import "dotenv/config";

import prisma from "@/shared/db";
import { hashPassword } from "@/shared/lib/utils";

// 模拟当前用户（luck2 zhang / zhangluck598@gmail.com）在数据库中的 ID
// ! 此 ID 为 scripts/db 下所有 seed 脚本共用的 OWNER_ID，必须保持一致
const OWNER_ID = "cmrjdu92f0001099de7h2zu5p";

// 测试账号配置：邮箱、明文密码、显示名（仅本地开发填充，勿在生产环境使用）
const USER_PROFILE = {
	email: "zhangluck59811@gmail.com",
	password: "kAb&bI8;IhHUI&Sw1",
	name: "luck2 zhang",
} as const;

// 主流程：按固定 OWNER_ID upsert 测试用户，保证其他 seed 脚本的 ownerId 外键始终有效
const main = async (): Promise<void> => {
	const passwordHash = await hashPassword(USER_PROFILE.password);

	const user = await prisma.user.upsert({
		where: { id: OWNER_ID },
		create: {
			id: OWNER_ID,
			email: USER_PROFILE.email,
			name: USER_PROFILE.name,
			passwordHash,
			emailVerified: new Date(),
		},
		update: {
			email: USER_PROFILE.email,
			name: USER_PROFILE.name,
			passwordHash,
			emailVerified: new Date(),
		},
		select: { id: true, email: true, name: true },
	});

	console.log(`测试用户已就绪：${user.id}  (${user.email})`);
};

main()
	.catch((error: unknown) => {
		console.error("填充测试用户失败:", error);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});

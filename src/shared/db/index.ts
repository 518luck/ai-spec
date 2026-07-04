import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/shared/db/generator/client";

// 将 global 强制转换为包含 prisma 属性的对象类型，用于在全局范围缓存 Prisma 实例
const globalForPrisma = global as unknown as {
	prisma: PrismaClient; // 定义全局对象中的 prisma 类型
};

// 创建数据库适配器实例，使用环境变量中的数据库连接字符串
const adapter = new PrismaPg({
	connectionString: process.env.DATABASE_URL, // 传入数据库 URL
});

// 初始化 Prisma 实例：优先使用全局缓存中的实例，如果没有则新建一个
const prisma =
	globalForPrisma.prisma ||
	new PrismaClient({
		adapter,
	});

// 如果不是生产环境，则将当前实例存入全局变量，防止开发环境下热更新（Hot Reload）导致创建过多的数据库连接
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma; // 默认导出该单例实例，供全站使用

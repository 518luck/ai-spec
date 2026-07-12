import type { DefaultSession } from "next-auth";

// # NextAuth 类型扩展：声明 session.user.id 字段供类型系统识别
declare module "next-auth" {
	interface Session {
		user: {
			id: string;
		} & DefaultSession["user"];
	}
}

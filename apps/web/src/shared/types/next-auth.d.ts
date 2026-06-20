import type { DefaultSession } from "next-auth";

// 扩展 NextAuth Session 类型，使 session.user.id 可被类型系统识别
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

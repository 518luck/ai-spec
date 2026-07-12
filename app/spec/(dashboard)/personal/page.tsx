import { redirect } from "next/navigation";

// # 个人空间入口（重定向到收录页）

// 个人空间默认页重定向到收录。
export default function Page(): never {
	redirect("/spec/personal/prompt/records");
}

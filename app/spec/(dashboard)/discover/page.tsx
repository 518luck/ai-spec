import { redirect } from "next/navigation";

// # 发现页入口（重定向到 Prompt 广场）
export default function Page(): never {
	redirect("/spec/discover/prompt");
}

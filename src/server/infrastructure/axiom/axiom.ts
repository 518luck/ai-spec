import { Axiom } from "@axiomhq/js";

// 读取必填环境变量；缺失时立即抛错，避免运行时静默失败
function getEnv(key: string): string {
	const value = process.env[key];
	if (!value) {
		throw new Error(`环境变量 ${key} 未配置`);
	}
	return value;
}

export const axiomClient = new Axiom({
	token: getEnv("AXIOM_TOKEN"),
});

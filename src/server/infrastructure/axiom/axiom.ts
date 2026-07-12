import { Axiom } from "@axiomhq/js";

// # Axiom 客户端：读取环境变量初始化日志上报 SDK

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

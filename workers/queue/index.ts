// # 队列 Worker 总入口：装配并启动 background / discover / translation 三个 Worker
// > 启动顺序：dotenv 加载环境变量 → worker-globals 装全局补丁 → 启动子 Worker
// > ESM 副作用 import 顺序敏感：worker-globals 必须先于任何业务模块执行

import "dotenv/config";
import "./worker-globals";

// 副作用 import：加载即触发 new Worker(...) 装配 + 事件监听
import "./background-worker";
import "./discover-worker";
import "./translation-worker";

import { backgroundJobsWorker } from "./background-worker";
import { discoverWorker } from "./discover-worker";
import { translationWorker } from "./translation-worker";

// 优雅退出：收到 SIGTERM/SIGINT 时关闭全部 Worker 连接
async function shutdown(): Promise<void> {
	console.warn("正在关闭...");
	try {
		await Promise.all([
			backgroundJobsWorker.close(),
			discoverWorker.close(),
			translationWorker.close(),
		]);
	} catch (err) {
		console.error("关闭时出错", {
			error: err instanceof Error ? err.message : String(err),
		});
	} finally {
		process.exit(0);
	}
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

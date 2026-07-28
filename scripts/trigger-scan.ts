// # 手动触发广场扫描：立刻往 discover 队列投一个 discover-scan 任务
// > 用法：
// >   pnpm scan                                            跑全部源（和定时任务一样）
// >   pnpm test:scan:one                                   只跑 ComposioHQ/awesome-claude-skills（测试）
// >   pnpm exec tsx scripts/trigger-scan.ts --source=owner/name
// > 前提：worker 进程已在跑（否则任务投进去没人消费）

import "dotenv/config";
// ! 必须先于业务模块加载：业务模块顶层间接 import axiom，依赖 globalThis.AsyncLocalStorage（tsx 脚本环境不自带）
import "../workers/queue/worker-globals";

import { enqueueDiscoverScan } from "@/server/infrastructure/queue";

// 从命令行参数解析 --source=xxx（找不到返回 undefined，表示跑全部）
const parseSource = (): string | undefined => {
	const match = process.argv.find((arg) => arg.startsWith("--source="));
	return match?.slice("--source=".length);
};

const source = parseSource();

enqueueDiscoverScan(source ? { source } : {})
	.then(() => {
		console.warn(`✅ 已投递 discover-scan 任务${source ? `（仅源: ${source}）` : "（全部源）"}`);
		console.warn("   请确认 worker 进程在跑(pnpm worker),否则任务会卡在队列里");
		process.exit(0);
	})
	.catch((err) => {
		console.error("❌ 投递失败:", err instanceof Error ? err.message : String(err));
		process.exit(1);
	});

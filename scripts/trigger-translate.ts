// # 手动触发批量补译（测试/补跑用）：往 translation 队列投 translate-batch
// > 生产日常靠 worker 内 TRANSLATION_BATCH_CRON 定时调度；本脚本只在本地验证或临时补跑时用
// > 用法：
// >   pnpm translate                         默认 skills，批大小走配置
// >   pnpm translate --limit=200             指定本批条数
// >   pnpm translate --resource=skills       指定资源（目前仅 skills）
// >   pnpm translate --no-chain              本批结束后不自动续跑
// > 前提：worker 已在跑（pnpm worker），且配置了 TENCENT_SECRET_ID / TENCENT_SECRET_KEY

import "dotenv/config";
// ! 必须先于业务模块加载：业务模块顶层间接 import axiom，依赖 globalThis.AsyncLocalStorage
import "../workers/queue/worker-globals";

import { enqueueTranslateBatch } from "@/server/infrastructure/queue";
import type { TranslationResourceType } from "@/server/infrastructure/queue/operations/translation";

// 从命令行解析 --limit=N
const parseLimit = (): number | undefined => {
	const match = process.argv.find((arg) => arg.startsWith("--limit="));
	if (!match) {
		return undefined;
	}
	const value = Number(match.slice("--limit=".length));
	return Number.isFinite(value) && value > 0 ? Math.floor(value) : undefined;
};

// 从命令行解析 --resource=xxx，默认 skills
const parseResource = (): TranslationResourceType => {
	const match = process.argv.find((arg) => arg.startsWith("--resource="));
	const value = match?.slice("--resource=".length) ?? "skills";
	if (value === "skills") {
		return value;
	}
	throw new Error(`不支持的资源类型: ${value}（当前仅 skills）`);
};

const limit = parseLimit();
const resourceType = parseResource();
const chain = !process.argv.includes("--no-chain");

enqueueTranslateBatch({
	resourceType,
	...(limit !== undefined ? { limit } : {}),
	chain,
})
	.then(() => {
		const parts = [
			`resource=${resourceType}`,
			limit !== undefined ? `limit=${limit}` : "limit=默认",
			`chain=${chain}`,
		];
		console.warn(`✅ 已投递 translate-batch 任务（${parts.join(", ")}）`);
		console.warn(
			"   请确认 worker 在跑(pnpm worker)，且已配置 TENCENT_SECRET_ID / TENCENT_SECRET_KEY",
		);
		process.exit(0);
	})
	.catch((err) => {
		console.error("❌ 投递失败:", err instanceof Error ? err.message : String(err));
		process.exit(1);
	});

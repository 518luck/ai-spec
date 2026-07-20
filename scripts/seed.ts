import { spawnSync } from "node:child_process";

// # 一键填充编排器：按顺序调用 scripts/db 下的各 seed 脚本
// > 修改下方 STEPS.enabled 控制默认执行范围，或运行时用 --only / --skip 临时覆盖
// ! 必须从项目根目录运行： pnpm exec tsx scripts/seed.ts

// 单个步骤的配置：enabled=是否默认执行、script=相对项目根的脚本路径、desc=中文描述
interface StepOptions {
	enabled: boolean;
	script: string;
	desc: string;
}

// 工厂函数：显式参数对象类型，把 enabled 拓宽为 boolean（避免字面量 true 导致 set(false) 报错）
const defineStep = ({ enabled, script, desc }: StepOptions): StepOptions => ({
	enabled,
	script,
	desc,
});

// 步骤注册表：对象 key 的书写顺序即执行顺序；user 在最前（其他步骤的 ownerId 外键依赖它）
const STEPS = {
	user: defineStep({
		enabled: true,
		script: "scripts/db/user.ts",
		desc: "测试用户",
	}),
	promptDraftFolders: defineStep({
		enabled: true,
		script: "scripts/db/prompt-draft-folders.ts",
		desc: "草稿文件夹",
	}),
	promptRecordFolders: defineStep({
		enabled: true,
		script: "scripts/db/prompt-record-folders.ts",
		desc: "收录文件夹",
	}),
	promptDrafts: defineStep({
		enabled: true,
		script: "scripts/db/prompt-drafts.ts",
		desc: "草稿",
	}),
	promptRecords: defineStep({
		enabled: true,
		script: "scripts/db/prompt-records.ts",
		desc: "收录",
	}),
	tags: defineStep({
		enabled: true,
		script: "scripts/db/tags.ts",
		desc: "标签",
	}),
};

// 失败策略：continue=继续后续步骤，abort=任一步骤失败立即中止
const ON_FAILURE = "abort" as const;

// 解析命令行参数：--only=a,b 只跑指定；--skip=c 跳过指定（覆盖 STEPS.enabled）
const resolveEnabledFlags = (argv: string[]): { name: keyof typeof STEPS; enabled: boolean }[] => {
	const all = Object.keys(STEPS) as Array<keyof typeof STEPS>;
	const flags = new Map(all.map((name) => [name, STEPS[name].enabled]));

	for (const arg of argv.slice(2)) {
		const only = /^--only=(.+)$/.exec(arg)?.[1];
		if (only) {
			const wanted = new Set(only.split(","));
			for (const name of all) flags.set(name, wanted.has(name));
			continue;
		}
		const skip = /^--skip=(.+)$/.exec(arg)?.[1];
		if (skip) {
			for (const raw of skip.split(",")) {
				const name = raw as keyof typeof STEPS;
				if (flags.has(name)) flags.set(name, false);
			}
		}
	}

	return all.map((name) => ({ name, enabled: flags.get(name) ?? false }));
};

// 执行单个步骤：pnpm exec tsx 调用子脚本，stdio 直通终端实时显示输出
const runStep = (script: string): { ok: boolean; elapsed: string } => {
	const start = Date.now();
	const result = spawnSync(`pnpm exec tsx ${script}`, {
		stdio: "inherit",
		shell: true,
	});
	const elapsed = ((Date.now() - start) / 1000).toFixed(1);
	return { ok: result.status === 0, elapsed };
};

// 主流程：按顺序执行开启的步骤，失败时按 ON_FAILURE 决定是否中止，最后汇总
const main = (): void => {
	const flags = resolveEnabledFlags(process.argv);
	const queue = flags.filter((f) => f.enabled);

	if (queue.length === 0) {
		console.log("没有要执行的步骤（检查 STEPS.enabled 或 --only/--skip 参数）");
		return;
	}

	console.log(`将依次执行 ${queue.length} 个步骤：${queue.map((q) => q.name).join(" → ")}`);

	const results: Array<{
		name: keyof typeof STEPS;
		desc: string;
		ok: boolean;
		elapsed: string;
	}> = [];
	const totalStart = Date.now();

	for (const { name } of queue) {
		const { script, desc } = STEPS[name];
		console.log(`\n■ [${desc}] ${name}  (${script})`);
		const r = runStep(script);
		results.push({ name, desc, ...r });
		if (!r.ok && ON_FAILURE === "abort") {
			console.error(`\n✗ ${name} 失败，已中止（ON_FAILURE=abort）`);
			break;
		}
	}

	const totalElapsed = ((Date.now() - totalStart) / 1000).toFixed(1);
	const failed = results.filter((r) => !r.ok).length;

	console.log("\n========== 汇总 ==========");
	for (const r of results) {
		console.log(`${r.ok ? "✓" : "✗"}  ${r.desc}  ${r.name}  (${r.elapsed}s)`);
	}
	console.log("--------------------------");
	console.log(`成功 ${results.length - failed} / 失败 ${failed} / 总耗时 ${totalElapsed}s`);
	if (failed > 0) process.exit(1);
};

main();

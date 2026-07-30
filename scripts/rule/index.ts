import { spawnSync } from "node:child_process";

// # 规约测试脚本编排器：按顺序调用 seed-spaces → folders → tags → rules
// > 复用 scripts/seed.ts 的 spawnSync 模式，支持 --only / --skip 临时覆盖
// ! 必须从项目根目录运行： pnpm exec tsx scripts/rule/index.ts

interface StepOptions {
	enabled: boolean;
	script: string;
	desc: string;
}

// 工厂函数：显式参数对象类型，避免字面量 true 导致 set(false) 类型报错
const defineStep = ({ enabled, script, desc }: StepOptions): StepOptions => ({
	enabled,
	script,
	desc,
});

// 步骤注册表：对象 key 顺序即执行顺序；spaces 最先（folders/rules 依赖其 spaceId）
const STEPS = {
	spaces: defineStep({
		enabled: true,
		script: "scripts/rule/seed-spaces.ts",
		desc: "领域空间",
	}),
	folders: defineStep({
		enabled: true,
		script: "scripts/rule/seed-folders.ts",
		desc: "规约文件夹",
	}),
	tags: defineStep({
		enabled: true,
		script: "scripts/rule/seed-tags.ts",
		desc: "规约标签",
	}),
	rules: defineStep({
		enabled: true,
		script: "scripts/rule/seed-rules.ts",
		desc: "规约规则",
	}),
} as const;

// 失败策略：任一步骤失败立即中止
const ON_FAILURE = "abort" as const;

// 解析命令行参数：--only=a,b 只跑指定；--skip=c 跳过指定
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

// 主流程：按顺序执行开启的步骤，失败即中止，末尾汇总
const main = (): void => {
	const flags = resolveEnabledFlags(process.argv);
	const queue = flags.filter((f) => f.enabled);

	if (queue.length === 0) {
		console.log("没有要执行的步骤（检查 --only/--skip 参数）");
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

	console.log("\n========== 规约测试汇总 ==========");
	for (const r of results) {
		console.log(`${r.ok ? "✓" : "✗"}  ${r.desc}  ${r.name}  (${r.elapsed}s)`);
	}
	console.log("-----------------------------------");
	console.log(`成功 ${results.length - failed} / 失败 ${failed} / 总耗时 ${totalElapsed}s`);
	if (failed > 0) process.exit(1);
};

main();

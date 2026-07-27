import { AWESOME_SOURCES } from "@/server/configs/discover.config";
import { fetchAwesomeRepos, fetchRepoHeadSha } from "@/server/utils/discover-import";
import prisma from "@/shared/db";

import { enqueueDiscoverSweep } from "../enqueues/discover-sweep";
import { enqueueDiscoverSyncRepo } from "../enqueues/discover-sync-repo";

// # 处理器：发现 + 编排——刷新 awesome 货源清单、fan-out 各仓库同步任务、收尾投递 sweep

// 休眠货源的试探间隔：每周给一次复活机会，避免天天撞已死仓库
const DORMANT_PROBE_MS = 7 * 24 * 60 * 60 * 1000;

export async function processDiscoverScan(): Promise<void> {
	// ① 逐个 awesome 目录：sha 没变整层跳过；变了重新解析 README，把新仓库登记进货源清单
	// ! 单源失败只记录不中断，保证 fan-out 与 sweep 始终执行
	for (const listRepo of AWESOME_SOURCES) {
		try {
			await refreshAwesomeSource(listRepo);
		} catch (e) {
			console.error("awesome 源刷新失败", {
				listRepo,
				error: e instanceof Error ? e.message : String(e),
			});
		}
	}

	// ② fan-out：active 全量 + 休眠超一周的试探名额，各投一条同步任务（worker 单并发串行消费天然限流）
	const probeBefore = new Date(Date.now() - DORMANT_PROBE_MS);
	const targets = await prisma.discoverSource.findMany({
		where: {
			resourceType: "skills",
			kind: "repo",
			OR: [{ status: "active" }, { status: "dormant", updatedAt: { lt: probeBefore } }],
		},
		select: { repo: true },
	});
	for (const { repo } of targets) {
		await enqueueDiscoverSyncRepo({ repo });
	}

	// ③ 收尾：sweep 兜底下架"货源已休眠/消失"的条目（幂等，与休眠时的即时下架互为保障）
	await enqueueDiscoverSweep();
}

// 刷新单个 awesome 源：sha 比对 → 解析 README → 登记新仓库（已有货源不动，保留其状态）
const refreshAwesomeSource = async (listRepo: string): Promise<void> => {
	const source = await prisma.discoverSource.upsert({
		where: { repo_resourceType: { repo: listRepo, resourceType: "skills" } },
		create: { repo: listRepo, resourceType: "skills", kind: "awesome", addedFrom: "config" },
		update: {},
	});
	const head = await fetchRepoHeadSha({ repo: listRepo, etag: source.etag });
	if (head.notModified || head.sha === source.lastCommitSha) {
		return;
	}

	const repos = await fetchAwesomeRepos(listRepo);
	// > 这个地方是从awesome当中获取仓库列表
	await prisma.discoverSource.createMany({
		data: repos.map((repo) => ({
			repo,
			resourceType: "skills",
			kind: "repo" as const,
			addedFrom: listRepo,
		})),
		skipDuplicates: true,
	});
	await prisma.discoverSource.update({
		where: { repo_resourceType: { repo: listRepo, resourceType: "skills" } },
		data: { lastCommitSha: head.sha, etag: head.etag, lastSyncedAt: new Date() },
	});
};

import { SOURCE_FAIL_THRESHOLD } from "@/server/configs/discover.config";
import { AiSpecError } from "@/server/errors/http-error";
import { fetchRepoHeadSha } from "@/server/utils/discover-import";
import { importRepoSkills } from "@/server/utils/discover-sync";
import prisma from "@/shared/db";
import type { DiscoverSource } from "@/shared/db/generator/client";
import { ErrorCode } from "@/shared/lib/zod/schemas/error";

import { enqueueDiscoverSyncRepoDeferred } from "../enqueues/discover-sync-repo";
import type { DiscoverSyncRepoData } from "../types";

// # 处理器：同步单个仓库——sha 没变秒跳过（仅刷时间戳）；有新提交/休眠试探/上游改名走全量重抓

export async function processDiscoverSyncRepo({
	repo,
	deferrals = 0,
}: DiscoverSyncRepoData): Promise<void> {
	const source = await prisma.discoverSource.findUnique({
		where: { repo_resourceType: { repo, resourceType: "skills" } },
	});
	// 货源已被移除时跳过；dormant 允许通过（discover 每周投递一次试探）
	if (!source) {
		return;
	}

	try {
		// 休眠试探不带 etag：需要拿到真实 sha 与规范名走全量，让 importRepoSkills 复活条目并重置状态
		const probing = source.status === "dormant";
		const head = await fetchRepoHeadSha({
			repo,
			ref: source.syncRef,
			etag: probing ? null : source.etag,
		});

		// ! 上游改名或大小写差异（fetch 静默跟随 301）：按规范名重建后清掉旧行，避免双份来源与重复条目
		if (!head.notModified && head.canonicalRepo && head.canonicalRepo !== repo) {
			await mergeRenamedRepo({ source, canonicalRepo: head.canonicalRepo, headSha: head.sha });
			return;
		}

		// 304 或 sha 未变：只刷新货源时间戳，不重抓内容
		if (!probing && (head.notModified || head.sha === source.lastCommitSha)) {
			await prisma.discoverSource.update({
				where: { repo_resourceType: { repo, resourceType: "skills" } },
				data: {
					lastSyncedAt: new Date(),
					failCount: 0,
					...(head.notModified ? {} : { etag: head.etag }),
				},
			});
			return;
		}

		// 有新提交或休眠试探：全量重抓（importRepoSkills 内部完成 upsert、prune 与货源复活）
		await importRepoSkills({
			url: buildSourceUrl(source),
			headSha: head.notModified ? undefined : head.sha,
		});
		await prisma.discoverSource.update({
			where: { repo_resourceType: { repo, resourceType: "skills" } },
			data: { etag: head.notModified ? source.etag : head.etag },
		});
	} catch (e) {
		await handleSyncFailure({ source, deferrals, error: e });
	}
}

// 按货源记录的同步范围重建抓取 URL（分支/子目录导入的货源只同步原范围）
const buildSourceUrl = ({ repo, syncRef, pathPrefix }: DiscoverSource): string => {
	if (syncRef) {
		return `https://github.com/${repo}/tree/${syncRef}${pathPrefix ? `/${pathPrefix}` : ""}`;
	}
	return `https://github.com/${repo}`;
};

type MergeRenamedRepoOptions = {
	source: DiscoverSource;
	canonicalRepo: string;
	headSha: string;
};

// 改名合并：按规范名全量导入（建立/刷新新行），再删掉旧名下的货源与条目
const mergeRenamedRepo = async ({
	source,
	canonicalRepo,
	headSha,
}: MergeRenamedRepoOptions): Promise<void> => {
	await importRepoSkills({
		url: buildSourceUrl({ ...source, repo: canonicalRepo }),
		addedFrom: source.addedFrom ?? undefined,
		headSha,
	});
	// 旧名条目已在规范名下重建，直接删除（缓存行可随时重建）
	await prisma.discoverSkill.deleteMany({ where: { sourceRepo: source.repo } });
	await prisma.discoverSource.delete({
		where: { repo_resourceType: { repo: source.repo, resourceType: "skills" } },
	});
};

// 限流重投上限：超过后放弃本轮，明天的每日同步会重来
const MAX_RATE_LIMIT_DEFERRALS = 2;

type HandleSyncFailureOptions = {
	source: DiscoverSource;
	deferrals: number;
	error: unknown;
};

// 失败分级：限流→不计失败延迟重投；无货（404/409/无 SKILL.md）→休眠+下架；其余→计数达阈值休眠，否则抛给 BullMQ 重试
const handleSyncFailure = async ({
	source,
	deferrals,
	error,
}: HandleSyncFailureOptions): Promise<void> => {
	// ! 限流不是仓库的错：不动 failCount，65 分钟后（新限额窗口）重投
	if (error instanceof AiSpecError && error.code === ErrorCode.RATE_LIMITED) {
		if (deferrals < MAX_RATE_LIMIT_DEFERRALS) {
			await enqueueDiscoverSyncRepoDeferred({ repo: source.repo, deferrals: deferrals + 1 });
			return;
		}
		throw error;
	}

	if (error instanceof AiSpecError && error.code === ErrorCode.NOT_FOUND) {
		await dormantSource(source.repo);
		return;
	}

	const nextCount = source.failCount + 1;
	if (nextCount >= SOURCE_FAIL_THRESHOLD) {
		await dormantSource(source.repo);
		return;
	}
	await prisma.discoverSource.update({
		where: { repo_resourceType: { repo: source.repo, resourceType: "skills" } },
		data: { failCount: nextCount },
	});
	throw error;
};

// 货源休眠：状态置 dormant 并连带下架其条目；discover 每周试探一次，成功即全量复活
const dormantSource = async (repo: string): Promise<void> => {
	await prisma.discoverSource.update({
		where: { repo_resourceType: { repo, resourceType: "skills" } },
		data: { status: "dormant" },
	});
	await prisma.discoverSkill.updateMany({
		where: { sourceRepo: repo, delistedAt: null },
		data: { delistedAt: new Date() },
	});
};

import { resolveTranslationFields } from "@/server/infrastructure/translation";
import prisma from "@/shared/db";
import type { Prisma } from "@/shared/db/generator/client";
import type { DiscoverSkillListItemVo } from "@/shared/lib/zod/schemas/discover-skill";

import { discoverSkillListItemSelect, toDiscoverSkillListItem } from "../vo";
import { fetchRepoSkills, type RepoSkills } from "./import-github";

// # 广场同步共用逻辑：抓取仓库 → upsert 条目 → 清理消失路径 → 登记/刷新货源（手动导入与每日同步走同一条路）

type ImportRepoSkillsOptions = {
	url: string;
	// 发现渠道，仅在货源首次登记时写入（awesome 列表名 / "user-import" / "manual"）
	addedFrom?: string;
	// 调用方已取得的 HEAD commit sha；同步任务传入以供下次比对，手动导入可省略
	headSha?: string;
};

type ImportRepoSkillsResult = {
	saved: DiscoverSkillListItemVo[];
	repoSkills: RepoSkills;
};

// > 导入一个仓库：抓取解析 → 逐条 upsert → 下架上游已删除的路径 → 登记/刷新货源清单
export const importRepoSkills = async ({
	url,
	addedFrom,
	headSha,
}: ImportRepoSkillsOptions): Promise<ImportRepoSkillsResult> => {
	const repoSkills = await fetchRepoSkills(url);
	const {
		sourceRepo,
		authorName,
		authorType,
		authorAvatarUrl,
		authorHtmlUrl,
		stars,
		commitSha,
		ref,
		requestedRef,
		pathPrefix,
		skills,
	} = repoSkills;
	const syncedAt = new Date();

	const saved: DiscoverSkillListItemVo[] = [];
	for (const skill of skills) {
		const skillDir = skill.sourcePath.split("/").slice(0, -1).join("/");
		// 翻译字段：中文原文直接 done；英文进 pending 由后台补译；hash 未变则 update 时保留旧中文
		const translation = resolveTranslationFields(skill.description);
		// 广场只索引元数据（name/description/license/回链等），不落 SKILL.md 全文
		const baseData = {
			name: skill.name,
			description: skill.description,
			license: skill.license,
			sourceRepo,
			sourcePath: skill.sourcePath,
			sourceUrl: skillDir
				? `https://github.com/${sourceRepo}/tree/${ref}/${skillDir}`
				: `https://github.com/${sourceRepo}`,
			authorName,
			authorType: authorType as "Organization" | "User",
			authorAvatarUrl,
			authorHtmlUrl,
			stars,
			commitSha,
			delistedAt: null, // 上游复出/货源复活的条目自动复活
		} satisfies Omit<
			Prisma.DiscoverSkillUncheckedCreateInput,
			"descriptionZh" | "translationStatus" | "descriptionHash"
		>;

		// 先读旧行：description 未变时保留已有 translation 结果，避免同步把中文刷掉
		const existing = await prisma.discoverSkill.findUnique({
			where: { sourceRepo_sourcePath: { sourceRepo, sourcePath: skill.sourcePath } },
			select: {
				descriptionHash: true,
				descriptionZh: true,
				translationStatus: true,
			},
		});
		const descriptionUnchanged =
			existing?.descriptionHash != null && existing.descriptionHash === translation.textHash;

		const translationData = descriptionUnchanged
			? {
					descriptionZh: existing.descriptionZh,
					translationStatus: existing.translationStatus,
					descriptionHash: existing.descriptionHash,
				}
			: {
					descriptionZh: translation.textZh,
					translationStatus: translation.translationStatus,
					descriptionHash: translation.textHash,
				};

		const row = await prisma.discoverSkill.upsert({
			where: { sourceRepo_sourcePath: { sourceRepo, sourcePath: skill.sourcePath } },
			create: { ...baseData, ...translationData },
			update: { ...baseData, ...translationData },
			select: discoverSkillListItemSelect,
		});
		saved.push(toDiscoverSkillListItem(row));
	}

	// ! prune：上游已删除的路径立即下架（限定本次导入范围内，子目录导入不误伤范围外条目）
	await prisma.discoverSkill.updateMany({
		where: {
			sourceRepo,
			delistedAt: null,
			sourcePath: {
				notIn: skills.map((skill) => skill.sourcePath),
				...(pathPrefix && { startsWith: `${pathPrefix}/` }),
			},
		},
		data: { delistedAt: syncedAt },
	});

	// 登记/刷新货源：导入成功即视为一次成功同步，清零失败计数并激活（休眠试探成功由此复活）
	await prisma.discoverSource.upsert({
		where: { repo_resourceType: { repo: sourceRepo, resourceType: "skills" } },
		create: {
			repo: sourceRepo,
			resourceType: "skills",
			kind: "repo",
			addedFrom,
			syncRef: requestedRef,
			pathPrefix,
			lastCommitSha: headSha ?? null,
			lastSyncedAt: syncedAt,
		},
		update: {
			syncRef: requestedRef,
			pathPrefix,
			lastCommitSha: headSha ?? null,
			lastSyncedAt: syncedAt,
			failCount: 0,
			status: "active",
		},
	});

	return { saved, repoSkills };
};

import { fetchRepoSkills, type RepoSkills } from "@/server/utils/discover-import";
import { discoverSkillListItemSelect, toDiscoverSkillListItem } from "@/server/utils/discover-vo";
import prisma from "@/shared/db";
import type { Prisma } from "@/shared/db/generator/client";
import type { DiscoverSkillListItemVo } from "@/shared/lib/zod/schemas/discover-skill";

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
		const data: Prisma.DiscoverSkillUncheckedCreateInput = {
			name: skill.name,
			description: skill.description,
			// ! 无 license 的仓库只索引元数据与回链，不转载全文
			content: skill.license ? skill.content : null,
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
		};
		const row = await prisma.discoverSkill.upsert({
			where: { sourceRepo_sourcePath: { sourceRepo, sourcePath: skill.sourcePath } },
			create: data,
			update: data,
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

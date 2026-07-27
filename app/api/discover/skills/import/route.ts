import { NextResponse } from "next/server";

import { withPersonal } from "@/server/middleware/with-personal";
import { importRepoSkills } from "@/server/utils/discover-sync";
import {
	importDiscoverSkillsDtoSchema,
	importDiscoverSkillsVoSchema,
} from "@/shared/lib/zod/schemas/discover-skill";

// # Skills 广场：按 GitHub 链接导入（与每日同步共用 importRepoSkills，导入过的仓库自动加入同步清单）

// > 粘贴仓库/子目录链接 → 抓取解析 → upsert 入库并登记货源，重复导入即刷新
export const POST = withPersonal(
	async ({ req }) => {
		const parsed = importDiscoverSkillsDtoSchema.safeParse(await req.json());
		if (!parsed.success) {
			throw parsed.error;
		}

		const { saved } = await importRepoSkills({ url: parsed.data.url, addedFrom: "user-import" });

		const result = importDiscoverSkillsVoSchema.safeParse({
			imported: saved.length,
			skills: saved,
		});
		if (!result.success) {
			throw result.error;
		}

		return NextResponse.json(result.data, { status: 201 });
	},
	{ permissions: ["discover.write"] },
);

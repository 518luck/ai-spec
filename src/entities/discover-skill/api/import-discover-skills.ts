// # Skill 导入 API：把 GitHub 仓库链接交给后端抓取解析入库

import { resolveErrorMessage } from "@/entities/lib/fetch-error";
import type {
	ImportDiscoverSkillsDto,
	ImportDiscoverSkillsVo,
} from "@/shared/lib/zod/schemas/discover-skill";

// > POST /api/discover/skills/import：后端解析仓库内全部 SKILL.md 并入库；非 2xx 时抛统一错误
export const importDiscoverSkills = async (
	params: ImportDiscoverSkillsDto,
): Promise<ImportDiscoverSkillsVo> => {
	const response = await fetch("/api/discover/skills/import", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(params),
	});

	if (!response.ok) {
		throw new Error(await resolveErrorMessage(response));
	}

	return (await response.json()) as ImportDiscoverSkillsVo;
};

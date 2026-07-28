// # Skill 反馈 API：用户对广场条目提交「不合适/低质」等信号（只收集）

import { resolveErrorMessage } from "@/entities/lib/fetch-error";
import type {
	ReportDiscoverSkillDto,
	ReportDiscoverSkillVo,
} from "@/shared/lib/zod/schemas/discover-skill";

type ReportDiscoverSkillParams = ReportDiscoverSkillDto & {
	skillId: string;
};

// > POST /api/discover/skills/:id/report
export const reportDiscoverSkill = async ({
	skillId,
	...body
}: ReportDiscoverSkillParams): Promise<ReportDiscoverSkillVo> => {
	const response = await fetch(`/api/discover/skills/${encodeURIComponent(skillId)}/report`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	});

	if (!response.ok) {
		throw new Error(await resolveErrorMessage(response));
	}

	return (await response.json()) as ReportDiscoverSkillVo;
};

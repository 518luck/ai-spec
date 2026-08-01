// # oRPC 根 router：聚合所有领域子 router
// 注意：错误码注册在 error-registry.d.ts 环境声明里，TS 自动加载，无需 import

import { discoverOrganizationsRouter, discoverSkillsRouter } from "./routers/discover-skills";
import { draftsRouter } from "./routers/drafts";
import { foldersRouter } from "./routers/folders";
import { projectsRouter } from "./routers/projects";
import { recordsRouter } from "./routers/records";
import { ruleSpacesRouter, rulesRouter } from "./routers/rules";
import { tagsRouter } from "./routers/tags";
import { userRouter } from "./routers/user";

// 聚合所有领域：每个领域是一个子 router 树
export const appRouter = {
	rules: rulesRouter,
	ruleSpaces: ruleSpacesRouter,
	records: recordsRouter,
	drafts: draftsRouter,
	discoverSkills: discoverSkillsRouter,
	discoverOrganizations: discoverOrganizationsRouter,
	folders: foldersRouter,
	projects: projectsRouter,
	tags: tagsRouter,
	user: userRouter,
};

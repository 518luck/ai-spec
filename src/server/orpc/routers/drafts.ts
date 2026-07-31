// # 草稿 procedure 编排层：input 校验 → service → output 校验，声明 OpenAPI 路径
// 平移 app/api/prompt/drafts 下 5 个端点：list / create / getById / update / delete

import "@orpc/openapi/extensions/route"; // 启用 .route() 扩展（声明 method + path 给第三方）
import {
	createDraft,
	deleteDraft,
	getDraftById,
	listDrafts,
	updateDraft,
} from "@/server/domain/prompt/drafts/services";
import { z } from "@/shared/lib/zod";
import {
	createDraftDtoSchema,
	createDraftVoSchema,
	draftContentSchema,
	draftContentVoSchema,
	draftFolderIdSchema,
	draftImagesSchema,
	draftListVoSchema,
	draftNameSchema,
	listDraftsDtoSchema,
} from "@/shared/lib/zod/schemas/prompt/draft";
import { personalProcedure } from "../procedures";

// 更新入参：id 走 URL 路径，body 内所有字段可选（部分更新）
// updateDraftDtoSchema 带 .refine（至少一个字段），这里拆出 object 部分与路径参数合并后再补同样的 refine
const updateDraftInputSchema = z
	.object({
		id: z.string(),
		name: draftNameSchema.optional(),
		content: draftContentSchema.optional(),
		images: draftImagesSchema.optional(),
		folderId: draftFolderIdSchema.optional(),
	})
	.refine(
		(data) =>
			data.name !== undefined ||
			data.content !== undefined ||
			data.images !== undefined ||
			data.folderId !== undefined,
		{ error: "至少需要更新一个字段" },
	);

// > 草稿主资源 router：list / create / getById / update / delete
export const draftsRouter = {
	// 列表查询（GET /prompt/drafts）
	// permissions: promptDraft.read
	list: personalProcedure({ permissions: ["promptDraft.read"] })
		.route({ method: "GET", path: "/prompt/drafts" })
		.input(listDraftsDtoSchema)
		.output(draftListVoSchema)
		.handler(async ({ input, context }) => {
			return listDrafts({
				userId: context.session.user.id,
				q: input.q,
				filter: input.filter,
				folderId: input.folderId,
				page: input.page ?? 1,
			});
		}),

	// 创建（POST /prompt/drafts）：草稿不存版本、不存 tags
	// permissions: promptDraft.write
	create: personalProcedure({ permissions: ["promptDraft.write"] })
		.route({ method: "POST", path: "/prompt/drafts", successStatus: 201 })
		.input(createDraftDtoSchema)
		.output(createDraftVoSchema)
		.handler(async ({ input, context }) => {
			return createDraft({
				userId: context.session.user.id,
				name: input.name,
				content: input.content,
				images: input.images,
				folderId: input.folderId || null,
			});
		}),

	// 单条详情（GET /prompt/drafts/{id}）：name 可为 null
	// permissions: promptDraft.read
	getById: personalProcedure({ permissions: ["promptDraft.read"] })
		.route({ method: "GET", path: "/prompt/drafts/{id}" })
		.input(z.object({ id: z.string() }))
		.output(draftContentVoSchema)
		.handler(async ({ input, context }) => {
			return getDraftById({ userId: context.session.user.id, id: input.id });
		}),

	// 更新（PATCH /prompt/drafts/{id}）：纯 update，无事务无版本（草稿不存版本）
	// permissions: promptDraft.write
	update: personalProcedure({ permissions: ["promptDraft.write"] })
		.route({ method: "PATCH", path: "/prompt/drafts/{id}" })
		.input(updateDraftInputSchema)
		.output(createDraftVoSchema)
		.handler(async ({ input, context }) => {
			const { id, name, content, images, folderId } = input;
			return updateDraft({
				userId: context.session.user.id,
				id,
				patch: { name, content, images, folderId },
			});
		}),

	// 删除（DELETE /prompt/drafts/{id}）：硬删除
	// permissions: promptDraft.write
	delete: personalProcedure({ permissions: ["promptDraft.write"] })
		.route({ method: "DELETE", path: "/prompt/drafts/{id}" })
		.input(z.object({ id: z.string() }))
		.handler(async ({ input, context }) => {
			await deleteDraft({ userId: context.session.user.id, id: input.id });
			return { success: true };
		}),
};

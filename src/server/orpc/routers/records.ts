// # 收录 procedure 编排层：input 校验 → service → output 校验，声明 OpenAPI 路径
// > 路径与原 Next.js Route Handler 对齐，权限从源 route.ts 的 withPersonal 参数平移

import "@orpc/openapi/extensions/route"; // 启用 .route() 扩展（声明 method + path 给第三方）
import {
	copyRecord,
	createRecord,
	deleteRecord,
	favoriteRecord,
	getRecordById,
	getRecordVersionDetail,
	listRecords,
	listRecordVersions,
	unfavoriteRecord,
	updateRecord,
} from "@/server/domain/prompt/records/services";
import { z } from "@/shared/lib/zod";
import {
	createRecordDtoSchema,
	createRecordVoSchema,
	deleteRecordDtoSchema,
	favoriteToggleVoSchema,
	listRecordsDtoSchema,
	listVersionsDtoSchema,
	recordContentVoSchema,
	recordListVoSchema,
	updateRecordDtoSchema,
	versionDetailVoSchema,
	versionListVoSchema,
} from "@/shared/lib/zod/schemas/prompt/record";
import { personalProcedure } from "../procedures";

// 路径参数 schema（id / recordId / versionId 从 URL 取）
const recordIdPathSchema = z.object({ id: z.string() });
const versionPathSchema = z.object({ id: z.string(), versionId: z.string() });
const copyVoSchema = z.object({ success: z.boolean() });
  
// > 收录主资源 router：list / create / getById / update / delete
export const recordsRouter = {
	// 列表查询（GET /prompt/records）
	list: personalProcedure({ permissions: ["promptRecord.read"] })
		.route({ method: "GET", path: "/prompt/records" })
		.input(listRecordsDtoSchema)
		.output(recordListVoSchema)
		.handler(async ({ input, context }) => {
			// tagIds 为逗号分隔字符串，解析成数组；为空表示不按标签筛选
			const tagIds = (input.tagIds ?? "")
				.split(",")
				.map((s) => s.trim())
				.filter(Boolean);
			return listRecords({
				userId: context.session.user.id,
				folderId: input.folderId,
				tagIds,
				q: input.q,
				filter: input.filter,
				favorite: input.favorite,
				sort: input.sort,
				page: input.page ?? 1,
			});
		}),

	// 创建（POST /prompt/records）：内联建 v1 快照版本
	create: personalProcedure({ permissions: ["promptRecord.write"] })
		.route({ method: "POST", path: "/prompt/records", successStatus: 201 })
		.input(createRecordDtoSchema)
		.output(createRecordVoSchema)
		.handler(async ({ input, context }) => {
			return createRecord({
				userId: context.session.user.id,
				name: input.name,
				content: input.content,
				images: input.images,
				folderId: input.folderId || null,
				tags: input.tags,
			});
		}),

	// 单条详情（GET /prompt/records/{id}）
	getById: personalProcedure({ permissions: ["promptRecord.read"] })
		.route({ method: "GET", path: "/prompt/records/{id}" })
		.input(recordIdPathSchema)
		.output(recordContentVoSchema)
		.handler(async ({ input, context }) => {
			return getRecordById({ userId: context.session.user.id, id: input.id });
		}),

	// 部分更新（PATCH /prompt/records/{id}）：含版本记录
	update: personalProcedure({ permissions: ["promptRecord.write"] })
		.route({ method: "PATCH", path: "/prompt/records/{id}" })
		.input(recordIdPathSchema.extend(updateRecordDtoSchema.shape))
		.output(createRecordVoSchema)
		.handler(async ({ input, context }) => {
			const { id, name, content, images, folderId, tags, message } = input;
			return updateRecord({
				userId: context.session.user.id,
				id,
				patch: { name, content, images, folderId, tags, message },
			});
		}),

	// 删除（DELETE /prompt/records/{id}）
	delete: personalProcedure({ permissions: ["promptRecord.write"] })
		.route({ method: "DELETE", path: "/prompt/records/{id}" })
		.input(deleteRecordDtoSchema)
		.handler(async ({ input, context }) => {
			await deleteRecord({ userId: context.session.user.id, id: input.id });
			return { success: true };
		}),

	// > 收录子资源 router：收藏开关 / 版本历史
	favorite: {
		// 加入收藏（POST /prompt/records/{id}/favorite）
		toggle: personalProcedure({ permissions: ["promptRecord.write"] })
			.route({ method: "POST", path: "/prompt/records/{id}/favorite" })
			.input(recordIdPathSchema)
			.output(favoriteToggleVoSchema)
			.handler(async ({ input, context }) => {
				return favoriteRecord({
					userId: context.session.user.id,
					recordId: input.id,
				});
			}),

		// 取消收藏（DELETE /prompt/records/{id}/favorite）
		off: personalProcedure({ permissions: ["promptRecord.write"] })
			.route({ method: "DELETE", path: "/prompt/records/{id}/favorite" })
			.input(recordIdPathSchema)
			.output(favoriteToggleVoSchema)
			.handler(async ({ input, context }) => {
				return unfavoriteRecord({
					userId: context.session.user.id,
					recordId: input.id,
				});
			}),
	},

	// 复制计数自增（POST /prompt/records/{id}/copies）：不校验归属，命中 0 行静默无副作用
	// > 注意权限是 read 不是 write（与源 route.ts 的 withPersonal 一致）
	copies: personalProcedure({ permissions: ["promptRecord.read"] })
		.route({ method: "POST", path: "/prompt/records/{id}/copies" })
		.input(recordIdPathSchema)
		.output(copyVoSchema)
		.handler(async ({ input }) => {
			return copyRecord({ recordId: input.id });
		}),

	// 版本列表（GET /prompt/records/{id}/versions）
	versions: {
		// 版本列表
		list: personalProcedure({ permissions: ["promptRecord.read"] })
			.route({ method: "GET", path: "/prompt/records/{id}/versions" })
			.input(recordIdPathSchema.extend(listVersionsDtoSchema.shape))
			.output(versionListVoSchema)
			.handler(async ({ input, context }) => {
				return listRecordVersions({
					userId: context.session.user.id,
					recordId: input.id,
					page: input.page ?? 1,
					pageSize: input.pageSize ?? 20,
				});
			}),

		// 版本详情（GET /prompt/records/{id}/versions/{versionId}）：快照/diff 重建
		detail: personalProcedure({ permissions: ["promptRecord.read"] })
			.route({ method: "GET", path: "/prompt/records/{id}/versions/{versionId}" })
			.input(versionPathSchema)
			.output(versionDetailVoSchema)
			.handler(async ({ input, context }) => {
				return getRecordVersionDetail({
					userId: context.session.user.id,
					recordId: input.id,
					versionId: input.versionId,
				});
			}),
	},
};

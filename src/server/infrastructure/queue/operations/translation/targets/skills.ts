import { resolveTranslationFields } from "@/server/utils/discover-translation";
import prisma from "@/shared/db";

import type {
	TranslationLocalUpdate,
	TranslationPendingRow,
	TranslationTarget,
	TranslationTranslatedUpdate,
} from "./types";

// # skills 翻译 target：DiscoverSkill.description → descriptionZh

export const skillsTranslationTarget: TranslationTarget = {
	resourceType: "skills",

	async fetchPending(limit: number): Promise<TranslationPendingRow[]> {
		const rows = await prisma.discoverSkill.findMany({
			where: {
				delistedAt: null,
				translationStatus: { in: ["pending", "failed"] },
			},
			orderBy: [{ stars: "desc" }, { id: "asc" }],
			take: limit,
			select: { id: true, description: true },
		});
		return rows.map((row) => ({ id: row.id, text: row.description }));
	},

	async applyLocal(items: TranslationLocalUpdate[]): Promise<void> {
		if (items.length === 0) {
			return;
		}
		await prisma.$transaction(
			items.map((item) =>
				prisma.discoverSkill.update({
					where: { id: item.id },
					data: {
						descriptionZh: item.textZh,
						translationStatus: item.status,
						descriptionHash: item.textHash,
					},
				}),
			),
		);
	},

	async applyTranslated(items: TranslationTranslatedUpdate[]): Promise<void> {
		if (items.length === 0) {
			return;
		}
		await prisma.$transaction(
			items.map((item) => {
				const fields = resolveTranslationFields(item.text);
				return prisma.discoverSkill.update({
					where: { id: item.id },
					data: {
						descriptionZh: item.textZh,
						translationStatus: "done",
						descriptionHash: fields.textHash,
					},
				});
			}),
		);
	},

	async markFailed(ids: string[]): Promise<void> {
		if (ids.length === 0) {
			return;
		}
		await prisma.discoverSkill.updateMany({
			where: { id: { in: ids } },
			data: { translationStatus: "failed" },
		});
	},

	async hasMorePending(): Promise<boolean> {
		const row = await prisma.discoverSkill.findFirst({
			where: {
				delistedAt: null,
				translationStatus: { in: ["pending", "failed"] },
			},
			select: { id: true },
		});
		return row !== null;
	},
};

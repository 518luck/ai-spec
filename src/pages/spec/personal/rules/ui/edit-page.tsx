"use client";

// # 编辑规约页：薄壳，SWR 拉取详情回填 + 注入更新专属的 schema 校验 + mutation 保存逻辑

import { useRouter } from "next/navigation";
import type { JSX } from "react";
import useSWR, { useSWRConfig } from "swr";
import useSWRMutation from "swr/mutation";

import { getRule, getRuleVersionDetail, updateRule } from "@/entities/rule";
import { toast } from "@/features/toast";
import {
	type RuleVo,
	type UpdateRuleDto,
	updateRuleDtoSchema,
} from "@/shared/lib/zod/schemas/rule";
import { Button } from "@/shared/ui/button";
import { Icons } from "@/shared/ui/icons";
import { ScaleLoaderWrap } from "@/shared/ui/scale-loader";
import { RuleEditorForm, type RuleEditorPayload } from "./rule-editor-form";

// 模式：view=详情（默认预览态），edit=编辑（默认编辑态）
type RulePageMode = "view" | "edit";

type EditRulePageProps = {
	id: string;
	mode?: RulePageMode;
	// 版本页「使用此版本」带回时，载入该版本内容到编辑器（不落库，待编辑）
	useVersionId?: string;
};

export function EditRulePage({ id, mode = "edit", useVersionId }: EditRulePageProps): JSX.Element {
	const router = useRouter();
	const { mutate } = useSWRConfig();
	// 拉取规约详情用于回填
	const { data: rule, isLoading } = useSWR(["rule", id], () => getRule(id));
	// 有 useVersionId 时额外拉版本内容（恢复载入用，不落库）
	const { data: versionDetail } = useSWR(
		useVersionId ? ["rule-version-detail", id, useVersionId] : null,
		() => getRuleVersionDetail({ ruleId: id, versionId: useVersionId as string }),
	);
	// 更新规约 mutation
	const { trigger: triggerUpdateRule } = useSWRMutation<RuleVo, Error, string, UpdateRuleDto>(
		`update-rule-${id}`,
		async (_key, { arg }) => updateRule(id, arg),
	);

	// 保存逻辑：schema 校验 + 更新 + 失效缓存（单条详情 + 列表）+ toast + 跳回列表
	const handleSave = async (payload: RuleEditorPayload): Promise<boolean> => {
		const parsed = updateRuleDtoSchema.safeParse(payload);
		if (!parsed.success) {
			toast.error(parsed.error.issues[0]?.message ?? "请填写规约信息");
			return false;
		}

		await triggerUpdateRule(parsed.data);
		// 失效单条详情与列表缓存，确保再进详情/列表是新数据
		await mutate((key) => Array.isArray(key) && (key[0] === "rule" || key[0] === "rules"));
		toast.success("规约已保存");
		router.push("/spec/personal/rules");
		return true;
	};

	// 有 useVersionId 时要等版本内容拉完；否则等规约详情拉完
	const isLoadingState = useVersionId ? isLoading || !rule || !versionDetail : isLoading || !rule;
	if (isLoadingState || !rule) {
		return (
			<div className="flex h-[60vh] items-center justify-center">
				<ScaleLoaderWrap height={24} width={3} margin={2} radius={2} />
			</div>
		);
	}

	// 恢复版本载入时强制进编辑态（让用户能直接改恢复的内容），其余按 mode
	const isView = mode === "view" && !useVersionId;
	// useVersionId 优先：用版本内容覆盖 content，其余字段仍用当前规约的（版本只记 name+content）
	const initialContent = useVersionId && versionDetail ? versionDetail.content : rule.content;

	return (
		<RuleEditorForm
			title={isView ? "查看规约" : "编辑规约"}
			submitLabel="保存"
			initialPreview={isView}
			initialValues={{
				name: rule.name,
				content: initialContent,
				folderId: rule.folderId,
				tags: rule.tags,
			}}
			onSave={handleSave}
			// 版本历史入口：跳到该规约的版本页（列表 + diff + 恢复载入）
			headerAction={
				<Button
					variant="ghost"
					size="icon-sm"
					aria-label="版本历史"
					onClick={() => router.push(`/spec/personal/rules/${id}/versions`)}
				>
					<Icons.history className="size-4" />
				</Button>
			}
		/>
	);
}

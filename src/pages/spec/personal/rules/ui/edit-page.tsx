"use client";

// # 编辑规约页：薄壳，SWR 拉取详情回填 + 注入更新专属的 schema 校验 + mutation 保存逻辑

import { useRouter } from "next/navigation";
import type { JSX } from "react";
import useSWR, { useSWRConfig } from "swr";
import useSWRMutation from "swr/mutation";

import { getRule, updateRule } from "@/entities/rule";
import { toast } from "@/features/toast";
import {
	type RuleVo,
	type UpdateRuleDto,
	updateRuleDtoSchema,
} from "@/shared/lib/zod/schemas/rule";
import { ScaleLoaderWrap } from "@/shared/ui/scale-loader";
import { RuleEditorForm, type RuleEditorPayload } from "./rule-editor-form";

// 模式：view=详情（默认预览态），edit=编辑（默认编辑态）
type RulePageMode = "view" | "edit";

type EditRulePageProps = {
	id: string;
	mode?: RulePageMode;
};

export function EditRulePage({ id, mode = "edit" }: EditRulePageProps): JSX.Element {
	const router = useRouter();
	const { mutate } = useSWRConfig();
	// 拉取规约详情用于回填
	const { data: rule, isLoading } = useSWR(["rule", id], () => getRule(id));
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

	if (isLoading || !rule) {
		return (
			<div className="flex h-[60vh] items-center justify-center">
				<ScaleLoaderWrap height={24} width={3} margin={2} radius={2} />
			</div>
		);
	}

	const isView = mode === "view";

	return (
		<RuleEditorForm
			title={isView ? "查看规约" : "编辑规约"}
			submitLabel="保存"
			initialPreview={isView}
			initialValues={{
				name: rule.name,
				content: rule.content,
				folderId: rule.folderId,
				tags: rule.tags,
			}}
			onSave={handleSave}
		/>
	);
}

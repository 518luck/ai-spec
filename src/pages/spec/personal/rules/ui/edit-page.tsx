"use client";

// # 编辑规约页：薄壳，SWR 拉取详情回填 + 注入更新专属的 schema 校验 + mutation 保存逻辑

import { useRouter } from "next/navigation";
import type { JSX } from "react";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";

import { getRule, updateRule } from "@/entities/rule";
import { toast } from "@/features/toast";
import {
	type RuleVo,
	type UpdateRuleDto,
	updateRuleDtoSchema,
} from "@/shared/lib/zod/schemas/rule";
import { ScaleLoaderWrap } from "@/shared/ui/scale-loader";
import { EditorForm, type EditorPayload } from "./editor-form";

type EditPageProps = {
	id: string;
};

export function EditPage({ id }: EditPageProps): JSX.Element {
	const router = useRouter();
	// 拉取规约详情用于回填
	const { data: rule, isLoading } = useSWR(["rule", id], () => getRule(id));
	// 更新规约 mutation
	const { trigger: triggerUpdateRule } = useSWRMutation<RuleVo, Error, string, UpdateRuleDto>(
		`update-rule-${id}`,
		async (_key, { arg }) => updateRule(id, arg),
	);

	// 保存逻辑：schema 校验 + 更新 + toast + 跳回列表；返回是否成功供表单控制按钮状态
	const handleSave = async (payload: EditorPayload): Promise<boolean> => {
		const parsed = updateRuleDtoSchema.safeParse(payload);
		if (!parsed.success) {
			toast.error(parsed.error.issues[0]?.message ?? "请填写规约信息");
			return false;
		}

		await triggerUpdateRule(parsed.data);
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

	return (
		<EditorForm
			title="编辑规约"
			submitLabel="保存"
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

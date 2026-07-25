"use client";

// # 创建规约页：薄壳，注入创建专属的 schema 校验 + mutation 保存逻辑

import { useRouter } from "next/navigation";
import type { JSX } from "react";
import useSWRMutation from "swr/mutation";

import { createRule } from "@/entities/rule";
import { toast } from "@/features/toast";
import {
	type CreateRuleDto,
	createRuleDtoSchema,
	type RuleVo,
} from "@/shared/lib/zod/schemas/rule";
import { RuleEditorForm, type RuleEditorPayload } from "./rule-editor-form";

export function CreateRulePage(): JSX.Element {
	const router = useRouter();
	// 创建规约 mutation
	const { trigger: triggerCreateRule } = useSWRMutation<RuleVo, Error, string, CreateRuleDto>(
		"create-rule",
		async (_key, { arg }) => createRule(arg),
	);

	// 保存逻辑：schema 校验 + 创建 + toast + 跳回列表；返回是否成功供表单控制按钮状态
	const handleSave = async (payload: RuleEditorPayload): Promise<boolean> => {
		const parsed = createRuleDtoSchema.safeParse(payload);
		if (!parsed.success) {
			toast.error(parsed.error.issues[0]?.message ?? "请填写规约信息");
			return false;
		}

		await triggerCreateRule(parsed.data);
		toast.success("规约已创建");
		router.push("/spec/personal/rules");
		return true;
	};

	return <RuleEditorForm title="创建规约" submitLabel="创建" onSave={handleSave} />;
}

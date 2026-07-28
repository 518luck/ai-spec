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
import { EditorForm, type EditorPayload } from "./editor-form";

type CreatePageProps = {
	// 目标领域空间：列表页跳转时带在 URL 上，没带则由后端落到个人默认空间
	spaceId?: string;
};

export function CreatePage({ spaceId }: CreatePageProps): JSX.Element {
	const router = useRouter();
	// 创建规约 mutation
	const { trigger: triggerCreateRule } = useSWRMutation<RuleVo, Error, string, CreateRuleDto>(
		"create-rule",
		async (_key, { arg }) => createRule(arg),
	);

	// 保存逻辑：schema 校验 + 创建 + toast + 跳回列表；返回是否成功供表单控制按钮状态
	const handleSave = async (payload: EditorPayload): Promise<boolean> => {
		const parsed = createRuleDtoSchema.safeParse({ ...payload, spaceId });
		if (!parsed.success) {
			toast.error(parsed.error.issues[0]?.message ?? "请填写规约信息");
			return false;
		}

		await triggerCreateRule(parsed.data);
		toast.success("规约已创建");
		// 回列表时带回原空间，避免创建完跳到默认空间看不到新规约
		router.push(`/spec/personal/rules${spaceId ? `?spaceId=${spaceId}` : ""}`);
		return true;
	};

	return <EditorForm title="创建规约" spaceId={spaceId} submitLabel="创建" onSave={handleSave} />;
}

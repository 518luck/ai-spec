"use client";

// # 创建规约页：左右分栏布局，左侧大文本编辑，右侧设置面板

import { useRouter } from "next/navigation";
import type { JSX } from "react";
import { useState } from "react";
import useSWRMutation from "swr/mutation";

import { createRule } from "@/entities/rule";
import { FolderCombobox } from "@/features/folder-combobox";
import { toast } from "@/features/toast";
import { createRuleDtoSchema, type RuleVo } from "@/shared/lib/zod/schemas/rule";
import { Button } from "@/shared/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/shared/ui/field";
import { Icons } from "@/shared/ui/icons";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";
import { TitlePageShell } from "@/widgets/page-shell";

export function CreateRulePage(): JSX.Element {
	const router = useRouter();
	const [name, setName] = useState("");
	const [content, setContent] = useState("");
	const [folderId, setFolderId] = useState<string | null>(null);

	// 创建规约 mutation
	const { trigger: triggerCreateRule, isMutating } = useSWRMutation<
		RuleVo,
		Error,
		string,
		{ name: string; content: string; folderId: string | null }
	>("create-rule", async (_key, { arg }) => createRule(arg));

	// 返回上一页
	const handleBack = (): void => {
		router.back();
	};

	// 提交创建
	const handleSubmit = async (): Promise<void> => {
		const parsed = createRuleDtoSchema.safeParse({
			name: name.trim(),
			content: content.trim(),
			folderId: folderId || "",
		});

		if (!parsed.success) {
			toast.error(parsed.error.issues[0]?.message ?? "请填写规约信息");
			return;
		}

		await triggerCreateRule(parsed.data);
		toast.success("规约已创建");
		router.push("/spec/personal/rules");
	};

	return (
		<TitlePageShell
			title={
				<div className="flex w-full items-center justify-between">
					<div className="flex min-w-0 items-center gap-3">
						<Button variant="ghost" size="icon-sm" aria-label="返回" onClick={handleBack}>
							<Icons.chevronLeft className="size-4" />
						</Button>
						<h1 className="shrink-0 font-semibold text-lg">创建规约</h1>
					</div>
					<Button size="sm" disabled={isMutating} onClick={handleSubmit}>
						{isMutating ? "创建中..." : "创建"}
					</Button>
				</div>
			}
		>
			{/* // @ 左右分栏：左侧内容编辑，右侧设置面板 */}
			<div className="flex min-h-[calc(100vh-4rem)]">
				{/* 左侧：规约内容编辑区，随页面滚动；右侧留出 fixed 面板的占位宽度 */}
				<div className="min-w-0 flex-1 pr-72">
					<div className="p-6">
						<Textarea
							placeholder="在这里输入规约内容，支持 Markdown 格式..."
							value={content}
							onChange={(e) => setContent(e.target.value)}
							className="min-h-[calc(100vh-12rem)] resize-none"
						/>
					</div>
				</div>

				{/* 右侧：设置面板，fixed 浮窗，始终钉在视口右侧不随页面滚动 */}
				<div className="fixed top-20 right-4 z-30 m-4 w-64 shrink-0">
					<div className="rounded-lg border bg-card p-4 shadow-sm">
						<FieldGroup>
							{/* 规约名称 */}
							<Field>
								<FieldLabel>规约名称</FieldLabel>
								<Input
									placeholder="给规约取个名字"
									value={name}
									onChange={(e) => setName(e.target.value)}
									maxLength={64}
								/>
							</Field>

							{/* 所属文件夹 */}
							<Field>
								<FieldLabel>所属文件夹</FieldLabel>
								<FolderCombobox resourceType="ruleFolder" value={folderId} onChange={setFolderId} />
							</Field>
						</FieldGroup>

						{/* 提示信息 */}
						<div className="mt-4 border-t pt-4 text-muted-foreground text-xs">
							<p>支持 Markdown 格式</p>
						</div>
					</div>
				</div>
			</div>
		</TitlePageShell>
	);
}

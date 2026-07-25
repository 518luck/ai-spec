"use client";

// # 规约编辑表单：标题栏（返回 + 标题 + 保存）+ 左右分栏（左内容编辑 / 右设置面板），创建页与编辑页共用
// > 内部管理 name/content/folderId/tags 状态，提交时 schema 校验后交父组件的 onSave 落库

import { useRouter } from "next/navigation";
import type { JSX } from "react";
import { useState } from "react";
import { FolderCombobox } from "@/features/folder-combobox";
import { TagSelectTrigger } from "@/features/tag-combobox/ui/tag-select-trigger";
import type { TagOptionVo } from "@/shared/lib/zod/schemas/tag";
import { Button } from "@/shared/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/shared/ui/field";
import { Icons } from "@/shared/ui/icons";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";
import { TitlePageShell } from "@/widgets/page-shell";

// 表单提交载荷：创建/更新共用形状（字段均可选以兼容部分更新；创建时父组件要求 name/content 必填）
export type RuleEditorPayload = {
	name: string;
	content: string;
	folderId: string | null;
	tags: string[];
};

type RuleEditorFormProps = {
	// 顶部标题（如「创建规约」「编辑规约」）
	title: string;
	// 初始值：编辑页回填，创建页传空
	initialValues?: {
		name?: string;
		content?: string;
		folderId?: string | null;
		tags?: TagOptionVo[];
	};
	// 提交：表单完成 schema 校验后交父组件落库；返回成功/失败供表单控制按钮状态
	onSave: (payload: RuleEditorPayload) => Promise<boolean>;
	// 保存按钮文案：创建/保存
	submitLabel: string;
};

// 默认初始值：空表单（创建页用）
const DEFAULT_INITIAL = {
	name: "",
	content: "",
	folderId: null,
	tags: [] as TagOptionVo[],
};

// > 规约编辑表单：标题栏 + 左右分栏，state 内聚，父组件只管数据获取和落库
export function RuleEditorForm({
	title,
	initialValues,
	onSave,
	submitLabel,
}: RuleEditorFormProps): JSX.Element {
	const router = useRouter();
	const [name, setName] = useState(initialValues?.name ?? DEFAULT_INITIAL.name);
	const [content, setContent] = useState(initialValues?.content ?? DEFAULT_INITIAL.content);
	const [folderId, setFolderId] = useState<string | null>(initialValues?.folderId ?? null);
	const [tags, setTags] = useState<TagOptionVo[]>(initialValues?.tags ?? DEFAULT_INITIAL.tags);
	const [isSaving, setIsSaving] = useState(false);

	// 返回上一页
	const handleBack = (): void => {
		router.back();
	};

	// 提交：组装 payload 交父组件落库，按返回值控制按钮状态
	const handleSubmit = async (): Promise<void> => {
		setIsSaving(true);
		try {
			await onSave({
				name: name.trim(),
				content: content.trim(),
				folderId,
				tags: tags.map((t) => t.id),
			});
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<TitlePageShell
			title={
				<div className="flex w-full items-center justify-between">
					<div className="flex min-w-0 items-center gap-3">
						<Button variant="ghost" size="icon-sm" aria-label="返回" onClick={handleBack}>
							<Icons.chevronLeft className="size-4" />
						</Button>
						<h1 className="shrink-0 font-semibold text-lg">{title}</h1>
					</div>
					<Button size="sm" disabled={isSaving} onClick={handleSubmit}>
						{isSaving ? `${submitLabel}中...` : submitLabel}
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

							{/* 规约标签 */}
							<Field>
								<FieldLabel>标签</FieldLabel>
								<TagSelectTrigger resourceType="rules" value={tags} onChange={setTags} />
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

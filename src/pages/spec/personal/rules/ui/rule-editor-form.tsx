"use client";

// # 规约编辑表单：顶部状态栏（返回 + 名称 + 标签 + 文件夹 + 保存）+ 内容区 Textarea，创建页与编辑页共用
// > 名称默认取正文首个非空行；用户手动改过后与正文首行脱钩，之后再改正文不再覆盖名称

import { useRouter } from "next/navigation";
import type { JSX } from "react";
import { useState } from "react";
import { FolderCombobox } from "@/features/folder-combobox";
import { TagSelectTrigger } from "@/features/tag-combobox/ui/tag-select-trigger";
import type { TagOptionVo } from "@/shared/lib/zod/schemas/tag";
import { Button } from "@/shared/ui/button";
import { Icons } from "@/shared/ui/icons";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";
import { TitlePageShell } from "@/widgets/page-shell";

// 表单提交载荷：创建/更新共用形状
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
	// 提交：表单完成 schema 校验后交父组件落库
	onSave: (payload: RuleEditorPayload) => Promise<boolean>;
	// 保存按钮文案：创建/保存
	submitLabel: string;
};

// 从内容首个非空行提取标题；全为空白时返回 undefined（由调用方兜底）
const extractTitle = (content: string): string | undefined => {
	for (const line of content.split("\n")) {
		const trimmed = line.trim();
		if (trimmed) return trimmed;
	}
	return undefined;
};

// > 规约编辑表单：顶部状态栏内聚 name/folder/tags 状态，父组件只管数据获取和落库
export function RuleEditorForm({
	title: headerTitle,
	initialValues,
	onSave,
	submitLabel,
}: RuleEditorFormProps): JSX.Element {
	const router = useRouter();
	const [name, setName] = useState(initialValues?.name ?? "");
	const [content, setContent] = useState(initialValues?.content ?? "");
	const [folderId, setFolderId] = useState<string | null>(initialValues?.folderId ?? null);
	const [tags, setTags] = useState<TagOptionVo[]>(initialValues?.tags ?? []);
	const [isSaving, setIsSaving] = useState(false);
	// 用户是否手动编辑过名称；编辑页回填了 name 视为已锁定，创建页跟随首行
	const [nameTouched, setNameTouched] = useState(Boolean(initialValues?.name));

	// 返回上一页
	const handleBack = (): void => {
		router.back();
	};

	// 名称手动编辑：标记 touched 后写入，之后不再跟随正文首行
	const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
		setNameTouched(true);
		setName(e.target.value);
	};

	// 正文变化：未手动改过名称时，名称跟随首个非空行
	const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>): void => {
		const next = e.target.value;
		setContent(next);
		if (!nameTouched) {
			setName(extractTitle(next) ?? "");
		}
	};

	// 提交：组装 payload 交父组件落库
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
				<div className="flex w-full items-center gap-2">
					<Button variant="ghost" size="icon-sm" aria-label="返回" onClick={handleBack}>
						<Icons.chevronLeft className="size-4" />
					</Button>
					<h1 className="shrink-0 font-semibold text-lg">{headerTitle}</h1>
					{/* // @ 可编辑名称：无边框透明输入，占满中部；默认取正文首行，手动改后脱钩 */}
					<Input
						value={name}
						onChange={handleNameChange}
						placeholder="规约名称（取自首行，可修改）"
						maxLength={64}
						className="h-9 min-w-0 flex-1 border-none bg-transparent px-1 shadow-none focus-visible:ring-0"
					/>
					{/* // @ 标签：紧凑 chips 模式，未选时只显示 + 按钮 */}
					<TagSelectTrigger
						resourceType="rules"
						value={tags}
						onChange={setTags}
						triggerVariant="ghost"
						iconOnly
						className="min-w-40 max-w-64"
					/>
					{/* // @ 文件夹：图标模式，hover 显示文件夹名 */}
					<FolderCombobox
						resourceType="ruleFolder"
						value={folderId}
						onChange={setFolderId}
						iconOnly
						className="shrink-0"
					/>
					<Button size="sm" disabled={isSaving} onClick={handleSubmit}>
						{isSaving ? `${submitLabel}中...` : submitLabel}
					</Button>
				</div>
			}
		>
			{/* 内容区：Textarea 撑满宽度，随页面滚动 */}
			<div className="p-6">
				<Textarea
					placeholder="在这里输入规约内容，支持 Markdown 格式..."
					value={content}
					onChange={handleContentChange}
					className="min-h-[calc(100vh-12rem)] resize-none"
				/>
			</div>
		</TitlePageShell>
	);
}

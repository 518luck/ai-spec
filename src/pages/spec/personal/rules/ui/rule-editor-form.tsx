"use client";

// # 规约编辑表单：顶部状态栏（返回 + 名称 + 快捷栏 + 标签 + 文件夹 + 保存）+ markdown 编辑器内容区，创建页与编辑页共用
// > 名称默认取正文首个非空行；用户手动改过后与正文首行脱钩，之后再改正文不再覆盖名称
// > editorRef 是 DOM 句柄，本层持有并传给 MarkdownEditor（挂 CodeMirror）+ QuickToolbar（执行格式化）

import type { ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { useRouter } from "next/navigation";
import type { JSX } from "react";
import { useEffect, useRef, useState } from "react";
import { FolderCombobox } from "@/features/folder-combobox";
import {
	extractTitle,
	MarkdownEditor,
	QuickToolbar,
	useEditorStore,
} from "@/features/markdown-editor";
import { TagSelectTrigger } from "@/features/tag-combobox/ui/tag-select-trigger";
import { useMounted } from "@/shared/hooks";
import type { TagOptionVo } from "@/shared/lib/zod/schemas/tag";
import { Button } from "@/shared/ui/button";
import { Icons } from "@/shared/ui/icons";
import { Input } from "@/shared/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";
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
	// 当前领域空间：创建页从 URL 带入，文件夹下拉只列该空间下的文件夹
	spaceId?: string;
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

// > 规约编辑表单：顶部状态栏内聚 name/folder/tags 状态，父组件只管数据获取和落库
export function RuleEditorForm({
	title: headerTitle,
	spaceId,
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

	// editorRef：本层持有，同时给 MarkdownEditor（挂 CodeMirror）和 QuickToolbar（执行格式化）
	const editorRef = useRef<ReactCodeMirrorRef>(null);

	const resetView = useEditorStore((s) => s.resetView);
	// ! 快捷栏顺序存在 localStorage，服务端取不到；挂载后再渲染，避免 hydration 不一致
	const mounted = useMounted();

	// 进页面重置编辑器运行态（isPreview/activeFormats），避免带着上次残留的预览模式打开
	useEffect(() => {
		resetView();
	}, [resetView]);

	// 返回上一页
	const handleBack = (): void => {
		router.back();
	};

	// 名称手动提交：写入后与正文首行脱钩；清空则恢复跟随首行
	const handleNameCommit = (next: string): void => {
		setNameTouched(Boolean(next));
		setName(next || (extractTitle(content) ?? ""));
	};

	// 正文变化：未手动改过名称时，名称跟随首个非空行
	const handleContentChange = (next: string): void => {
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
			// ! 关闭外层 ScrollArea：CodeMirror 的 height:100% 依赖父级稳定高度，ScrollArea viewport 会收缩到内容尺寸导致虚拟滚动失效
			scrollable={false}
			// 状态栏浮在编辑区之上：半透明毛玻璃，正文滚动时从其下方穿过
			floatingHeader
			title={
				<div className="flex w-full items-center gap-2">
					<Button variant="ghost" size="icon-sm" aria-label="返回" onClick={handleBack}>
						<Icons.chevronLeft className="size-4" />
					</Button>
					{/* // @ 名称即页面标题：有名称就顶掉「创建规约/编辑规约」；平时是纯文本，双击才变输入框 */}
					<EditableName value={name} fallback={headerTitle} onCommit={handleNameCommit} />
					{/* // @ 编辑器快捷栏：格式化/显示设置/预览切换，作用于 editorRef 指向的 CodeMirror */}
					{mounted && <QuickToolbar editorRef={editorRef} isExpanded />}
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
						resourceType="rules"
						spaceId={spaceId}
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
			{/* // @ 内容区：编辑器撑满整页（状态栏是浮层不占高度），本层只裁剪；编辑模式 CodeMirror 自滚，预览模式编辑器内部 ScrollArea 接管 */}
			<div className="min-h-0 flex-1 overflow-hidden">
				<MarkdownEditor
					ref={editorRef}
					value={content}
					onChange={handleContentChange}
					placeholder="写下你的规约内容吧，支持 Markdown"
					// > 编辑器底色改透明跟随页面背景（主题只保留语法配色），否则状态栏的半透明渐变会压在另一种底色上显脏
					// > 顶部留白 = 状态栏 h-16 再多 0.5rem，首行不被压住、上滚时文字从状态栏下穿过；左右对齐状态栏 px-6；覆盖内置样式需加 `!`
					editorClassName="[&_.cm-editor]:bg-transparent! [&_.cm-gutters]:bg-transparent! [&_.cm-scroller]:px-6! [&_.cm-scroller]:pt-18!"
					previewClassName="px-6 pt-18 pb-6"
				/>
			</div>
		</TitlePageShell>
	);
}

type EditableNameProps = {
	// 当前名称，空串表示还没取到（正文为空）
	value: string;
	// 名称为空时顶上的页面标题（创建规约/编辑规约）
	fallback: string;
	// 提交新名称（失焦或回车）；空串表示交还给正文首行接管
	onCommit: (next: string) => void;
};

// 双击才可编辑的页面标题：平时是一行纯文本（无边框无底色），双击或回车切成输入框，失焦/回车提交、Esc 放弃
function EditableName({ value, fallback, onCommit }: EditableNameProps): JSX.Element {
	const [isEditing, setIsEditing] = useState(false);
	// 编辑期间的草稿；Esc 直接丢弃不回写
	const [draft, setDraft] = useState(value);
	const inputRef = useRef<HTMLInputElement>(null);

	// 切进编辑态后聚焦并全选，省得用户先手动删一遍旧名字
	useEffect(() => {
		if (!isEditing) return;
		inputRef.current?.focus();
		inputRef.current?.select();
	}, [isEditing]);

	// 进入编辑：以当前名称起草
	const startEditing = (): void => {
		setDraft(value);
		setIsEditing(true);
	};

	// 提交草稿并退出编辑
	const commit = (): void => {
		setIsEditing(false);
		onCommit(draft.trim());
	};

	// 回车提交、Esc 放弃；两者都会让输入框卸载，不会再触发 blur 提交一次
	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
		if (e.key === "Enter") commit();
		if (e.key === "Escape") setIsEditing(false);
	};

	if (isEditing) {
		return (
			<Input
				ref={inputRef}
				value={draft}
				onChange={(e) => setDraft(e.target.value)}
				onBlur={commit}
				onKeyDown={handleKeyDown}
				placeholder="规约名称"
				maxLength={64}
				className="h-9 min-w-0 flex-1 border-none bg-transparent px-1 font-semibold text-lg shadow-none focus-visible:ring-0 md:text-lg dark:bg-transparent"
			/>
		);
	}

	return (
		<h1 className="flex min-w-0 flex-1 font-semibold text-lg">
			<Tooltip>
				<TooltipTrigger
					render={
						<button
							type="button"
							onDoubleClick={startEditing}
							onKeyDown={(e) => e.key === "Enter" && startEditing()}
							className="flex h-9 min-w-0 flex-1 cursor-text items-center px-1 text-left"
						/>
					}
				>
					<span className="truncate">{value || fallback}</span>
				</TooltipTrigger>
				<TooltipContent>双击修改名称（默认取正文首行）</TooltipContent>
			</Tooltip>
		</h1>
	);
}

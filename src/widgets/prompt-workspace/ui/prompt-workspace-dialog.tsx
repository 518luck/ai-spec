"use client";

// # 通用提示词工作台弹窗 —— 编排层：业务态 + 弹窗外壳 + 组合 markdown-editor
// > 编辑器状态全在 useEditorStore（独立 store），编排层不持有任何编辑器内部状态、不包 Provider
// > editorRef 是 DOM 句柄（非数据），编排层持有并传给 MarkdownEditor（挂 CodeMirror）+ QuickToolbar（执行格式化）
// > 保存行为通过 onSave 注入，关闭时触发；对外 props 不变，4 个调用点零改动

import type { ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { motion } from "motion/react";
import { useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import { type JSX, useEffect, useRef, useState } from "react";
import { FolderCombobox } from "@/features/folder-combobox";
import {
	extractTitle,
	MarkdownEditor,
	QuickToolbar,
	resolveEditorColors,
	useEditorStore,
} from "@/features/markdown-editor";
import { TagSelectTrigger } from "@/features/tag-combobox/ui/tag-select-trigger";
import { useLocalStorage } from "@/shared/hooks";
import type { TagOptionVo } from "@/shared/lib/zod/schemas/tag";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent } from "@/shared/ui/dialog";
import { Icons } from "@/shared/ui/icons";
import { ScaleLoaderWrap } from "@/shared/ui/scale-loader";

// 保存时传给外部的数据形状
export type PromptEditorSaveData = {
	name?: string;
	content: string;
	folderId: string | null;
	// 标签：仅收录支持，草稿不传；undefined 表示本次未启用标签、不更新该字段
	tags?: TagOptionVo[];
};

type PromptWorkspaceDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	// 保存逻辑由外部注入（草稿传 createDraft，收录传 createRecord）
	onSave: (data: PromptEditorSaveData) => Promise<void>;
	// 保存中状态由外部管理（useSWRMutation 的 isMutating）
	isSaving: boolean;
	// 加载中占位：编辑器区域显示 spinner，避免用不完整内容渲染
	isLoading?: boolean;
	// 文件夹归属的资源类型（"promptDraft" / "promptRecord"）
	resourceType: string;
	// 编辑器占位文案
	placeholder?: string;
	// 内容为空时的标题回退文案
	emptyTitle?: string;
	// 保存中遮罩文案
	savingText?: string;
	// 编辑模式才需要：初始内容和文件夹
	initialContent?: string;
	initialFolderId?: string | null;
	// > 是否启用标签（收录 true，草稿不传）；必须独立于 initialTags，因为创建场景没 initialTags 也要能选标签
	tagsEnabled?: boolean;
	// 编辑模式的初始标签（回填用），仅 tagsEnabled 时生效
	initialTags?: TagOptionVo[];
};

export function PromptWorkspaceDialog({
	open,
	onOpenChange,
	onSave,
	isSaving,
	isLoading = false,
	resourceType,
	placeholder = "写下你的想法…",
	emptyTitle = "无标题",
	savingText = "保存中...",
	initialContent,
	initialFolderId,
	tagsEnabled = false,
	initialTags,
}: PromptWorkspaceDialogProps): JSX.Element {
	const isEditMode = initialContent !== undefined;
	const [content, setContent] = useState(initialContent ?? "");
	// editorRef：编排层持有，传给 MarkdownEditor（挂 CodeMirror）+ QuickToolbar（执行格式化）
	const editorRef = useRef<ReactCodeMirrorRef>(null);

	// initialContent 外部变化时同步（编辑弹窗加载完成后从空切换到全文）
	useEffect(() => {
		setContent(initialContent ?? "");
	}, [initialContent]);

	// 文件夹归属：弹窗打开时从 URL ?folderId= 同步
	const searchParams = useSearchParams();
	const [folderId, setFolderId] = useState<string | null>(null);
	useEffect(() => {
		if (open) setFolderId(searchParams?.get("folderId") ?? initialFolderId ?? null);
	}, [open, searchParams, initialFolderId]);

	// 标签：仅 tagsEnabled 时启用；编辑模式从 initialTags 回填
	const [tags, setTags] = useState<TagOptionVo[]>([]);
	useEffect(() => {
		if (open && tagsEnabled) setTags(initialTags ?? []);
	}, [open, tagsEnabled, initialTags]);

	// 放大/缩小：弹窗尺寸状态（驱动 motion），编排层持有
	const [isExpanded, setIsExpanded] = useLocalStorage<boolean>(
		"prompt-workspace.isExpanded",
		false,
	);

	// 浮层背景色：从 store 订阅主题 id + 系统明暗派生（编排层只读这一项编辑器派生色）
	const { resolvedTheme } = useTheme();
	const editorThemeId = useEditorStore((s) => s.editorThemeId);
	const resetView = useEditorStore((s) => s.resetView);
	const { editorBgColor } = resolveEditorColors(editorThemeId, resolvedTheme === "dark");

	// 标题：从内容首行提取
	const title = extractTitle(content) ?? emptyTitle;

	// 关闭即保存：有内容则保存后关闭；创建模式清空业务态 + 重置编辑器视图态（store.resetView）
	const handleClose = async (): Promise<void> => {
		const trimmed = content.trim();
		if (trimmed) {
			try {
				await onSave({
					name: extractTitle(content) ?? emptyTitle,
					content,
					folderId,
					// tagsEnabled 时才传 tags（草稿不启用，传 undefined 让 record 的 Dto 走"不更新"分支）
					...(tagsEnabled && { tags }),
				});
			} catch {
				return; // 错误处理由 onSave 内部完成，这里只阻止关闭
			}
		}
		// 创建模式清空状态以便下次使用，编辑模式保留内容
		if (!isEditMode) {
			setContent("");
			setFolderId(null);
			setTags([]);
			// 重置编辑器视图态（isPreview/activeFormats）
			resetView();
		}
		onOpenChange(false);
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(next) => {
				if (!next) {
					void handleClose();
				} else {
					onOpenChange(next);
				}
			}}
		>
			<DialogContent
				showCloseButton={false}
				scrollable={false}
				// > 编辑器实际尺寸交给 motion.div 控制；外壳 w-fit 收缩到子元素宽度；sm:max-w-none 解除默认 sm:max-w-md（28rem）限制让 motion 固定宽度生效
				// > 背景改用编辑器主题色（editorBgColor）覆盖 bg-popover，与 CodeMirror 编辑区融为一体，避免"纸贴在弹窗上"的双层视觉
				// > ring-0 去掉默认 ring-1（motion 填满外壳后会叠成内描边白线）；shadow-lg 补回悬浮阴影，与 dropdown/sheet 视觉一致
				// ! 不用 render prop：motion.div 当 render 元素时，motion 的 transform 会覆盖 DialogContent 的居中 translate，导致弹窗偏下
				className="w-fit overflow-visible p-0 shadow-lg ring-0 sm:max-w-none"
				style={{ backgroundColor: editorBgColor }}
			>
				<motion.div
					transition={{ type: "spring", duration: 0.3, bounce: 0.1 }}
					// > rounded-xl 与 DialogContent 外壳圆角对齐：外壳 overflow-visible 不裁剪，实际裁剪由本层 overflow-hidden 完成，圆角必须同步否则内容显示成直角
					className="relative flex flex-col overflow-hidden rounded-xl"
					style={{ maxHeight: "85vh" }}
					initial={false}
					animate={{
						width: isExpanded ? "73rem" : "32rem",
						height: isExpanded ? "40rem" : "32rem",
					}}
				>
					{/* // @ 编辑器：内部按 isPreview 切编辑/预览；ref/theme/设置 从 store 取，无需 Provider */}
					<div className="min-h-0 flex-1 overflow-hidden">
						<MarkdownEditor
							ref={editorRef}
							value={content}
							onChange={setContent}
							placeholder={placeholder}
							isLoading={isLoading}
						/>
					</div>

					{/* // @ 顶部浮层：标题 + 标签 + 文件夹 + 快捷栏 + 放大；背景色从 store 派生 */}
					<div
						className="pointer-events-auto absolute inset-x-0 top-0 z-10 flex h-12 items-center gap-2 border-border/50 px-4 backdrop-blur-[1.5px]"
						style={{
							background: `linear-gradient(to bottom, ${editorBgColor}, ${editorBgColor}1A)`,
						}}
					>
						{/* 标题 */}
						<span className={`truncate font-semibold text-base ${isExpanded ? "w-64" : "w-32"}`}>
							{title}
						</span>

						{/* // @ 标签：仅收录启用；放大模式下显示 chips + 触发器，缩小模式下收起 */}
						{tagsEnabled && isExpanded ? (
							<TagSelectTrigger
								resourceType={resourceType}
								value={tags}
								onChange={setTags}
								triggerVariant="ghost"
								iconOnly
								maskColor={editorBgColor}
								className="min-w-40 max-w-40"
							/>
						) : null}

						{/* // @ 文件夹：缩小空间时只显示图标，放大后显示完整文字 */}
						<FolderCombobox
							resourceType={resourceType}
							value={folderId}
							onChange={setFolderId}
							className="shrink-0"
							iconOnly={!isExpanded}
						/>

						<div className="ml-auto flex items-center gap-2">
							{/* // @ 快捷栏：偏好从 store 取，tool 动作用 editorRef，对外只剩 editorRef + isExpanded */}
							<QuickToolbar editorRef={editorRef} isExpanded={isExpanded} />

							{/* // @ 放大/缩小：驱动弹窗 motion 尺寸 */}
							<Button
								variant="ghost"
								size="icon-sm"
								aria-label={isExpanded ? "缩小" : "放大"}
								onClick={() => setIsExpanded((prev) => !prev)}
							>
								{isExpanded ? (
									<Icons.minimize className="size-4" />
								) : (
									<Icons.expand className="size-4" />
								)}
							</Button>
						</div>
					</div>

					{/* 保存中遮罩 */}
					{isSaving && (
						<div className="absolute inset-0 z-50 flex items-center justify-center gap-2 bg-popover/80 text-muted-foreground backdrop-blur-sm">
							<ScaleLoaderWrap height={16} width={2} margin={1} radius={1} />
							<span className="text-sm">{savingText}</span>
						</div>
					)}
				</motion.div>
			</DialogContent>
		</Dialog>
	);
}

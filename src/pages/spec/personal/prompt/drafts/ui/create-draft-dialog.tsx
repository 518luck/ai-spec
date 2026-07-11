"use client";

import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";
import { Decoration, EditorView } from "@codemirror/view";
import CodeMirror from "@uiw/react-codemirror";
import { useRouter } from "next/navigation";
import { type JSX, useMemo, useState } from "react";
import { toast } from "sonner";
import { createDraft } from "@/entities/prompt";
import { createDraftDtoSchema } from "@/shared/lib/zod/schemas/prompt/draft";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent } from "@/shared/ui/dialog";
import { Icons } from "@/shared/ui/icons";
import "../styles/codemirror.css";

type CreateDraftDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

// 创建草稿弹窗：全屏 CodeMirror 编辑器，顶部导航栏自动提取首行作为标题，关闭时有内容则自动保存
export function CreateDraftDialog({ open, onOpenChange }: CreateDraftDialogProps): JSX.Element {
	const router = useRouter();
	const [content, setContent] = useState("");
	const [isSaving, setIsSaving] = useState(false);

	// Markdown 语法扩展（含代码块内语言高亮）+ 首行标题装饰，用 useMemo 缓存避免每次渲染重建
	const extensions = useMemo(
		() => [
			markdown({ base: markdownLanguage, codeLanguages: languages }),
			// 给第一行加 first-line-title class，配合 CSS 放大字号和加粗
			EditorView.decorations.of(() =>
				Decoration.set([Decoration.line({ class: "first-line-title" }).range(0)]),
			),
		],
		[],
	);

	// 从内容首行提取标题，为空时显示占位文案
	const title = content.split("\n")[0]?.trim() || "无标题草稿";

	// 关闭弹窗：有内容则保存后关闭，空内容直接关闭
	const handleClose = async (): Promise<void> => {
		const trimmed = content.trim();

		// 空内容直接关闭，不创建草稿
		if (!trimmed) {
			setContent("");
			onOpenChange(false);
			return;
		}

		// 有内容：预校验后调 API 创建
		const parsed = createDraftDtoSchema.safeParse({
			name: content.split("\n")[0]?.trim() || undefined,
			content,
		});
		if (!parsed.success) {
			toast.error(parsed.error.issues[0]?.message ?? "请输入草稿内容");
			return;
		}

		setIsSaving(true);
		try {
			await createDraft(parsed.data);
			toast.success("草稿已创建");
			setContent("");
			router.refresh();
			onOpenChange(false);
		} catch (error) {
			toast.error(error instanceof Error && error.message ? error.message : "创建失败，请稍后重试");
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(next) => {
				// 关闭时走保存逻辑，打开时直接放行
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
				className="flex aspect-square max-h-[85vh] flex-col overflow-hidden p-0 sm:max-w-lg"
			>
				{/* 编辑器区域：占满整个弹窗（含导航栏下方区域），CodeMirror 内部 scroller 自行滚动 */}
				<div className="min-h-0 flex-1 overflow-hidden">
					<CodeMirror
						value={content} // 编辑器内容（受控值，绑定 React state）
						onChange={setContent} // 内容变化时同步到 state
						extensions={extensions} // Markdown 语法支持（含首行标题放大装饰）
						placeholder="写下你的想法…" // 空内容时的占位文案
						height="100%" // 编辑器内部滚动容器高度，设为 100% 由外层 div 的 flex-1 撑满
						className="h-full text-sm" // h-full 让 CodeMirror 根元素也占满外层 div；text-sm 统一正文字号
						basicSetup={{
							lineNumbers: false, // 关闭行号（草稿不是代码，不需要 1 2 3 编号）
							foldGutter: false, // 关闭代码折叠（草稿一般不长，不需要收起区块）
							highlightActiveLine: false, // 关闭当前行背景高亮（写笔记时变色会分散注意力）
						}}
					/>
				</div>

				{/* 顶部导航栏：标题（左）+ 操作栏（右），浮在编辑器上方，半透明毛玻璃 */}
				<div className="pointer-events-auto absolute inset-x-0 top-0 z-10 flex h-12 items-center gap-2 border-border border-b bg-linear-to-b from-popover to-popover/10 px-4 backdrop-blur-[1.5px]">
					<span className="max-w-[20%] truncate font-semibold text-base">{title}</span>
					{isSaving && <span className="text-muted-foreground text-xs">保存中...</span>}

					{/* 操作栏：快捷操作（椭圆胶囊）+ 放大 + 更多操作 */}
					<div className="ml-auto flex items-center gap-2">
						{/* 快捷操作工具栏：不透明椭圆背景 */}
						<div className="flex items-center gap-0.5 rounded-full bg-muted p-0.5" />

						<Button variant="ghost" size="icon-sm" aria-label="更多操作">
							<Icons.more className="size-4" />
						</Button>
						<Button variant="ghost" size="icon-sm" aria-label="放大">
							<Icons.expand className="size-4" />
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}

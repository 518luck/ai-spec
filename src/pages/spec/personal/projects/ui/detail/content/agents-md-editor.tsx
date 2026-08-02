"use client";

// # 配置编辑器视图：顶部状态栏（返回 + 名称 + 快捷栏 + 保存）+ MarkdownEditor 内容区
// > 打开配置默认预览态（渲染效果），点快捷栏的预览切换进 CodeMirror 编辑；⌘S/⌘↵ 直接保存
// > 不带标签/文件夹/历史版本（与 rule-editor-form 对齐但按配置域裁剪）

import { useMutation, useQuery } from "@tanstack/react-query";
import type { ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { type JSX, useEffect, useRef, useState } from "react";
import { MarkdownEditor, QuickToolbar, useEditorStore } from "@/features/markdown-editor";
import { toast } from "@/features/toast";
import { useMounted } from "@/shared/hooks";
import { client } from "@/shared/lib/orpc/client";
import { projectKeys } from "@/shared/lib/orpc/query-keys";
import { orpc } from "@/shared/lib/orpc/query-utils";
import { Button } from "@/shared/ui/button";
import { Icons } from "@/shared/ui/icons";
import { Input } from "@/shared/ui/input";
import { ScaleLoaderWrap } from "@/shared/ui/scale-loader";

interface AgentsMdEditorProps {
	projectId: string;
	agentsMdId: string;
	/** 返回鸟瞰图列表 */
	onBack: () => void;
	/** 保存成功后通知上层刷新（树/卡片同步改名） */
	onSaved: () => void;
}

// > 编辑器视图：全文由 getById 拉取，name/content 受控；保存走 update 接口
export function AgentsMdEditor({
	projectId,
	agentsMdId,
	onBack,
	onSaved,
}: AgentsMdEditorProps): JSX.Element {
	const { data: agentsMd, isLoading } = useQuery({
		queryKey: projectKeys.agentsMdContent(projectId, agentsMdId),
		queryFn: () => client.agentsMds.getById({ projectId, id: agentsMdId }),
	});
	const [name, setName] = useState("");
	const [content, setContent] = useState("");
	const [isSaving, setIsSaving] = useState(false);
	const mounted = useMounted();
	// editorRef：传给 MarkdownEditor（挂 CodeMirror）+ QuickToolbar（执行格式化）
	const editorRef = useRef<ReactCodeMirrorRef>(null);
	// 打开配置默认预览态（渲染效果为主）；运行态不持久化，重置后下次打开仍是预览
	const setPreview = useEditorStore((s) => s.setPreview);

	// 全文到达后回填表单；query 缓存下 data 引用稳定，只回填一次
	useEffect(() => {
		if (agentsMd) {
			setName(agentsMd.name);
			setContent(agentsMd.content);
		}
	}, [agentsMd]);

	// 打开时切到预览态（新打开一份配置从预览开始）
	useEffect(() => {
		setPreview(true);
	}, [setPreview]);

	// 保存：全量提交 name + content；名称空由 zod 校验兜底，这里提前拦截
	const { mutateAsync: updateAsync } = useMutation({
		...orpc.agentsMds.update.mutationOptions(),
	});
	const handleSave = async (): Promise<void> => {
		const trimmed = name.trim();
		if (!trimmed) {
			toast.error("请输入配置名称");
			return;
		}
		setIsSaving(true);
		try {
			await updateAsync({ projectId, id: agentsMdId, name: trimmed, content });
			toast.success("已保存");
			onSaved();
		} catch (error) {
			toast.error(error instanceof Error && error.message ? error.message : "保存失败");
		} finally {
			setIsSaving(false);
		}
	};

	if (isLoading || !agentsMd) {
		return (
			<div className="flex min-h-60 flex-1 items-center justify-center">
				<ScaleLoaderWrap height={24} width={3} margin={2} radius={2} />
			</div>
		);
	}

	return (
		<div className="flex min-h-0 flex-1 flex-col">
			{/* // @ 顶部状态栏：返回 + 名称（可改）+ 快捷栏（格式化/预览切换）+ 保存 */}
			<div className="flex h-10 shrink-0 items-center gap-2 border-b px-4">
				<Button variant="ghost" size="icon-sm" aria-label="返回" onClick={onBack}>
					<Icons.chevronLeft className="size-4" />
				</Button>
				<Input
					value={name}
					onChange={(e) => setName(e.target.value)}
					placeholder="配置名称"
					className="h-7 max-w-64"
				/>
				{mounted ? <QuickToolbar editorRef={editorRef} isExpanded /> : null}
				<Button size="sm" className="ml-auto" disabled={isSaving} onClick={handleSave}>
					{isSaving ? "保存中..." : "保存"}
				</Button>
			</div>
			{/* // @ 内容区：编辑器撑满剩余高度；预览态内部 ScrollArea，编辑态 CodeMirror 自滚 */}
			<div className="min-h-0 flex-1 overflow-hidden">
				<MarkdownEditor
					ref={editorRef}
					value={content}
					onChange={setContent}
					previewClassName="px-6 py-4"
					onSubmitShortcut={handleSave}
				/>
			</div>
		</div>
	);
}

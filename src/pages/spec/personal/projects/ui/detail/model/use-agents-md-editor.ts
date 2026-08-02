// # 配置编辑器数据流 hook：全文查询 + 表单状态（名称/正文）+ 保存
// > 状态栏渲染在标题栏（组件层），本 hook 只提供状态与保存，组件负责摆放 UI

import { useMutation, useQuery } from "@tanstack/react-query";
import type { ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useEditorStore } from "@/features/markdown-editor";
import { toast } from "@/features/toast";
import { useMounted } from "@/shared/hooks";
import { client } from "@/shared/lib/orpc/client";
import { projectKeys } from "@/shared/lib/orpc/query-keys";
import { orpc } from "@/shared/lib/orpc/query-utils";

export const useAgentsMdEditor = (
	openedAgentsMd: { id: string; projectId: string } | null,
): {
	editName: string; // 名称输入框的受控值（标题栏展示/编辑）
	setEditName: (name: string) => void; // 名称变更回调
	editContent: string; // 正文编辑器的受控值
	setEditContent: (content: string) => void; // 正文变更回调
	isSaving: boolean; // 保存进行中（禁用保存按钮防重复提交）
	isLoading: boolean; // 全文加载中（内容区显示 spinner）
	mounted: boolean; // 客户端已挂载（QuickToolbar 需 DOM 就绪才渲染）
	editorRef: React.RefObject<ReactCodeMirrorRef | null>; // CodeMirror 句柄，传给 MarkdownEditor 与 QuickToolbar
	handleSave: () => Promise<void>; // 保存：校验名称 → 调 update 接口 → toast + 刷新（⌘S/⌘↵ 同路径）
} => {
	const router = useRouter();

	// 全文查询：仅打开配置时启用
	const { data: agentsMdContent, isLoading } = useQuery({
		queryKey: projectKeys.agentsMdContent(
			openedAgentsMd?.projectId ?? "",
			openedAgentsMd?.id ?? "",
		),
		queryFn: () =>
			client.agentsMds.getById({
				projectId: openedAgentsMd?.projectId ?? "",
				id: openedAgentsMd?.id ?? "",
			}),
		enabled: Boolean(openedAgentsMd),
	});

	// 表单状态 + 编辑句柄
	const [editName, setEditName] = useState("");
	const [editContent, setEditContent] = useState("");
	const [isSaving, setIsSaving] = useState(false);
	const mounted = useMounted();
	// editorRef：传给 MarkdownEditor（挂 CodeMirror）+ QuickToolbar（执行格式化）
	const editorRef = useRef<ReactCodeMirrorRef>(null);
	// 打开配置默认预览态（渲染效果为主）；运行态不持久化
	const setPreview = useEditorStore((s) => s.setPreview);

	// 全文到达后回填表单；query 缓存下 data 引用稳定，只回填一次
	useEffect(() => {
		if (agentsMdContent) {
			setEditName(agentsMdContent.name);
			setEditContent(agentsMdContent.content);
		}
	}, [agentsMdContent]);

	// 打开配置时切到预览态（新打开一份配置从预览开始）
	useEffect(() => {
		setPreview(true);
	}, [setPreview]);

	// > 保存：全量提交 name + content；名称空由 zod 校验兜底，这里提前拦截；⌘S/⌘↵ 同路径
	const { mutateAsync: updateAsync } = useMutation({
		...orpc.agentsMds.update.mutationOptions(),
	});
	const handleSave = async (): Promise<void> => {
		if (!openedAgentsMd) return;
		const trimmed = editName.trim();
		if (!trimmed) {
			toast.error("请输入配置名称");
			return;
		}
		setIsSaving(true);
		try {
			await updateAsync({
				projectId: openedAgentsMd.projectId,
				id: openedAgentsMd.id,
				name: trimmed,
				content: editContent,
			});
			toast.success("已保存");
			// 刷新服务端数据：树/卡片同步改名
			router.refresh();
		} catch (error) {
			toast.error(error instanceof Error && error.message ? error.message : "保存失败");
		} finally {
			setIsSaving(false);
		}
	};

	return {
		editName,
		setEditName,
		editContent,
		setEditContent,
		isSaving,
		isLoading,
		mounted,
		editorRef,
		handleSave,
	};
};

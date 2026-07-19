"use client";

import copy from "copy-to-clipboard";
import { type JSX, useState } from "react";
import useSWRMutation from "swr/mutation";
import { favoriteRecord, getRecord, unfavoriteRecord } from "@/entities/prompt";
import { toast } from "@/features/toast";
import { cn } from "@/shared/lib/utils";
import type { FavoriteToggleVo } from "@/shared/lib/zod/schemas/prompt/record";
import { Button } from "@/shared/ui/button";
import { Icons } from "@/shared/ui/icons";
import { Spinner } from "@/shared/ui/spinner";
import { PromptCard } from "../../shared/ui/prompt-card";
import { useRecordsMutate } from "../model/records-mutate-context";
import { EditRecordDialog } from "./edit-record-dialog";

type RecordCardProps = {
	// 收录 ID
	id: string;
	// 收录标题（必填，创建时已提取自第一个非空行）
	name: string;
	// 收录预览（截断后的内容）
	preview: string;
	// 当前用户是否已收藏，驱动★按钮激活态
	favorite: boolean;
};

// # 收录卡片：基于 PromptCard，注入收藏★ + 编辑操作 + 编辑弹窗
export function RecordCard({ id, name, preview, favorite }: RecordCardProps): JSX.Element {
	// 编辑弹窗开关
	const [editOpen, setEditOpen] = useState(false);
	// 复制进行中标志：拉全文期间禁用按钮 + 触发卡片 loading 蒙层
	const [isCopying, setIsCopying] = useState(false);

	// 复制：拉全文 → 写剪贴板。一次性只读请求，不需要缓存，用裸 fetch + useState 最直接
	const handleCopy = async (): Promise<void> => {
		setIsCopying(true);
		try {
			const { content } = await getRecord(id);
			copy(content);
			toast.success("已复制");
		} catch {
			toast.error("复制失败");
		} finally {
			setIsCopying(false);
		}
	};

	return (
		<PromptCard
			name={name}
			preview={preview}
			onCopy={handleCopy}
			isCopying={isCopying}
			// > 标题行右侧常驻★按钮：浮在透明复制层之上，可独立点击
			headerExtra={<FavoriteButton id={id} favorite={favorite} />}
			// > 底部 hover 遮罩的操作：编辑
			actions={
				<Button variant="ghost" size="icon-sm" aria-label="编辑" onClick={() => setEditOpen(true)}>
					<Icons.pencil className="size-4" />
				</Button>
			}
		>
			{/* 编辑弹窗 */}
			<EditRecordDialog id={id} open={editOpen} onOpenChange={setEditOpen} />
		</PromptCard>
	);
}

// 收藏★按钮：同步等 API 成功后通过 mutateRecords 重拉列表刷新激活态
function FavoriteButton({ id, favorite }: { id: string; favorite: boolean }): JSX.Element {
	const mutateRecords = useRecordsMutate();
	// 收藏开关 mutation；arg 为收录 id
	const { trigger: triggerToggle, isMutating } = useSWRMutation<
		FavoriteToggleVo,
		Error,
		string,
		string
	>("toggle-favorite-record", async (_key, { arg }) =>
		favorite ? unfavoriteRecord(arg) : favoriteRecord(arg),
	);

	const handleClick = async (): Promise<void> => {
		try {
			await triggerToggle(id);
			await mutateRecords();
		} catch (error) {
			toast.error(error instanceof Error && error.message ? error.message : "操作失败");
		}
	};

	return (
		<Button
			type="button"
			variant="ghost"
			size="icon-sm"
			aria-label={favorite ? "取消收藏" : "加入收藏"}
			aria-pressed={favorite}
			aria-busy={isMutating}
			disabled={isMutating}
			onClick={handleClick}
			className="-mt-1 -mr-1 size-6 text-muted-foreground hover:text-foreground"
		>
			{isMutating ? (
				<Spinner className="size-4" />
			) : (
				<Icons.star className={cn("size-4", favorite && "fill-current text-yellow-500")} />
			)}
		</Button>
	);
}

"use client";

import copy from "copy-to-clipboard";
import { useRouter } from "next/navigation";
import { type JSX, useState } from "react";
import useSWRMutation from "swr/mutation";
import {
	deleteRecord,
	favoriteRecord,
	getRecord,
	recordCopy,
	unfavoriteRecord,
} from "@/entities/prompt";
import { toast } from "@/features/toast";
import { cn } from "@/shared/lib/utils";
import type { FavoriteToggleVo } from "@/shared/lib/zod/schemas/prompt/record";
import { deleteRecordDtoSchema } from "@/shared/lib/zod/schemas/prompt/record";
import { Button } from "@/shared/ui/button";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { Icons } from "@/shared/ui/icons";
import { Spinner } from "@/shared/ui/spinner";
import { PromptCard } from "../../shared/ui/prompt-card";
import { useRecordsMutate } from "../model/records-mutate-context";

type RecordCardProps = {
	// 收录 ID
	id: string;
	// 收录标题（必填，创建时已提取自第一个非空行）
	name: string;
	// 收录预览（截断后的内容）
	preview: string;
	// 当前用户是否已收藏，驱动★按钮激活态
	favorite: boolean;
	// 点击编辑按钮时触发，由顶层全局编辑器接管打开
	onEdit: () => void;
};

// # 收录卡片：基于 PromptCard，注入收藏★ + 编辑/版本入口（编辑器由顶层全局管理）
export function RecordCard({ id, name, preview, favorite, onEdit }: RecordCardProps): JSX.Element {
	const router = useRouter();
	// 复制进行中标志：拉全文期间禁用按钮 + 触发卡片 loading 蒙层
	const [isCopying, setIsCopying] = useState(false);

	// 复制：拉全文 → 写剪贴板。一次性只读请求，不需要缓存，用裸 fetch + useState 最直接
	const handleCopy = async (): Promise<void> => {
		setIsCopying(true);
		try {
			const { content } = await getRecord(id);
			copy(content);
			toast.success("已复制");
			// 记一次使用：fire-and-forget，不 await，失败不影响复制体验
			recordCopy(id);
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
			// > 底部 hover 遮罩的操作：编辑（交给顶层全局编辑器）+ 版本历史 + 删除
			actions={
				<>
					<Button variant="ghost" size="icon-sm" aria-label="编辑" onClick={onEdit}>
						<Icons.pencil className="size-4" />
					</Button>
					<Button
						variant="ghost"
						size="icon-sm"
						aria-label="版本历史"
						onClick={() => router.push(`/spec/personal/prompt/records/${id}/versions`)}
					>
						<Icons.history className="size-4" />
					</Button>
					<DeleteRecordAction id={id} />
				</>
			}
		></PromptCard>
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

// 删除按钮 + 二次确认：确认后删除并重拉列表；失败时 toast 提示并 rethrow 让弹窗保持打开
function DeleteRecordAction({ id }: { id: string }): JSX.Element {
	const mutateRecords = useRecordsMutate();
	const [deleteOpen, setDeleteOpen] = useState(false);
	// 删除收录 mutation；arg 为收录 id
	const { trigger: triggerDeleteRecord } = useSWRMutation<void, Error, string, string>(
		"delete-record",
		async (_key, { arg }) => deleteRecord(arg),
	);

	// 确认删除：id 守卫 + 删除 + 通过 infinite bound mutate 重拉所有已挂载页
	const handleConfirmDelete = async (): Promise<void> => {
		const parsed = deleteRecordDtoSchema.safeParse({ id });
		if (!parsed.success) {
			toast.error(parsed.error.issues[0]?.message ?? "删除失败");
			return;
		}
		try {
			await triggerDeleteRecord(parsed.data.id);
			await mutateRecords();
			toast.success("已删除");
		} catch (error) {
			toast.error(error instanceof Error && error.message ? error.message : "删除失败");
			throw error; // rethrow 让 ConfirmDialog 不关闭，保留弹窗供用户重试
		}
	};

	return (
		<>
			<Button variant="ghost" size="icon-sm" aria-label="删除" onClick={() => setDeleteOpen(true)}>
				<Icons.trash className="size-4" />
			</Button>
			{/* 删除二次确认：收录含版本历史，删除会一并清掉，文案强调不可恢复 */}
			<ConfirmDialog
				open={deleteOpen}
				onOpenChange={setDeleteOpen}
				title="删除收录"
				description="此操作将永久删除该收录及其所有版本历史，无法恢复。确定继续吗？"
				confirmText="删除"
				variant="destructive"
				onConfirm={handleConfirmDelete}
			/>
		</>
	);
}

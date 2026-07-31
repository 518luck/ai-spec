"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import copy from "copy-to-clipboard";
import { useRouter } from "next/navigation";
import { type JSX, useState } from "react";
import { toast } from "@/features/toast";
import { client } from "@/shared/lib/orpc/client";
import { recordKeys } from "@/shared/lib/orpc/query-keys";
import { orpc } from "@/shared/lib/orpc/query-utils";
import { cn } from "@/shared/lib/utils";
import { deleteRecordDtoSchema } from "@/shared/lib/zod/schemas/prompt/record";
import { Button } from "@/shared/ui/button";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { ContentCard } from "@/shared/ui/content-card";
import { Icons } from "@/shared/ui/icons";
import { Spinner } from "@/shared/ui/spinner";

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
	// ! 顶层编辑器正在编辑本卡：为 true 时本卡撤掉形变锚点，交给弹窗那侧接管
	isEditing: boolean;
};

// ! 收录卡片与编辑弹窗共用的形变锚点 id：两侧分处不同文件，必须由同一个函数生成，否则 layoutId 对不上、形变静默失效
export const recordMorphId = (id: string): string => `record-morph-${id}`;

// # 收录卡片：基于 ContentCard，注入收藏★ + 编辑/版本入口（编辑器由顶层全局管理）
export function RecordCard({
	id,
	name,
	preview,
	favorite,
	onEdit,
	isEditing,
}: RecordCardProps): JSX.Element {
	const router = useRouter();
	// 复制进行中标志：拉全文期间禁用按钮 + 触发卡片 loading 蒙层
	const [isCopying, setIsCopying] = useState(false);

	// 复制：拉全文 → 写剪贴板。一次性只读请求，不需要缓存，用裸 client + useState 最直接
	const handleCopy = async (): Promise<void> => {
		setIsCopying(true);
		try {
			const { content } = await client.records.getById({ id });
			copy(content);
			toast.success("已复制");
			// 记一次使用：fire-and-forget，不 await，失败不影响复制体验
			void client.records.copies({ id }).catch(() => {
				// 统计是次要功能，静默失败
			});
		} catch {
			toast.error("复制失败");
		} finally {
			setIsCopying(false);
		}
	};

	return (
		<ContentCard
			name={name}
			preview={preview}
			previewClassName="font-mono"
			onClick={handleCopy}
			clickAriaLabel="复制"
			isPending={isCopying}
			morphId={recordMorphId(id)}
			isMorphing={isEditing}
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
		></ContentCard>
	);
}

// 收藏★按钮：乐观更新 + 失败回滚，成功后 invalidate 整个 records 域
function FavoriteButton({ id, favorite }: { id: string; favorite: boolean }): JSX.Element {
	const qc = useQueryClient();
	// 收藏开关 mutation：已收藏走 favorite.off，未收藏走 favorite.toggle（按当前态分流）
	const { mutateAsync: toggleFavoriteAsync, isPending } = useMutation({
		mutationFn: async () => {
			// ProcedureUtils.call 即底层 client，直接传 procedure 输入
			return favorite
				? orpc.records.favorite.off.call({ id })
				: orpc.records.favorite.toggle.call({ id });
		},
		// > 乐观更新：立即翻转 infinite 列表内本卡片的 favorite 标记，失败回滚
		onMutate: async () => {
			// 暂停正在进行的列表重拉，避免覆盖乐观值
			await qc.cancelQueries({ queryKey: recordKeys.all });
			qc.setQueriesData<{ pages: { data: { id: string; favorite: boolean }[] }[] }>(
				{ queryKey: recordKeys.all },
				(old) => {
					if (!old) return old;
					return {
						...old,
						pages: old.pages.map((page) => ({
							...page,
							data: page.data.map((item) =>
								item.id === id ? { ...item, favorite: !favorite } : item,
							),
						})),
					};
				},
			);
		},
		onError: () => {
			// 回滚：让列表重拉还原真实状态
			void qc.invalidateQueries({ queryKey: recordKeys.all });
		},
		onSettled: () => {
			// 成功/失败后对齐后端真实状态
			void qc.invalidateQueries({ queryKey: recordKeys.all });
		},
	});

	const handleClick = async (): Promise<void> => {
		try {
			await toggleFavoriteAsync();
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
			aria-busy={isPending}
			disabled={isPending}
			onClick={handleClick}
			className="-mt-1 -mr-1 size-6 text-muted-foreground hover:text-foreground"
		>
			{isPending ? (
				<Spinner className="size-4" />
			) : (
				<Icons.star className={cn("size-4", favorite && "fill-current text-yellow-500")} />
			)}
		</Button>
	);
}

// 删除按钮 + 二次确认：确认后删除并重拉列表；失败时 toast 提示并 rethrow 让弹窗保持打开
function DeleteRecordAction({ id }: { id: string }): JSX.Element {
	const qc = useQueryClient();
	const [deleteOpen, setDeleteOpen] = useState(false);
	// 删除收录 mutation；成功后 invalidate 整个 records 域重拉所有已挂载页
	const { mutateAsync: deleteRecordAsync } = useMutation({
		...orpc.records.delete.mutationOptions(),
		onSuccess: () => {
			void qc.invalidateQueries({ queryKey: recordKeys.all });
		},
	});

	// 确认删除：id 守卫 + 删除 + 通过 invalidate 重拉所有已挂载页
	const handleConfirmDelete = async (): Promise<void> => {
		const parsed = deleteRecordDtoSchema.safeParse({ id });
		if (!parsed.success) {
			toast.error(parsed.error.issues[0]?.message ?? "删除失败");
			return;
		}
		try {
			// mutationFn 接收的就是 procedure 输入（id 走路径参数）
			await deleteRecordAsync({ id: parsed.data.id });
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

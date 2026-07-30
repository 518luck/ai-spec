"use client";

// # 规约卡片：基于 ContentCard，点击整卡复制全文，hover 出编辑 + 删除

import copy from "copy-to-clipboard";
import { useRouter } from "next/navigation";
import { type JSX, useState } from "react";

import { getRule } from "@/entities/rule";
import { toast } from "@/features/toast";
import type { RuleListItemVo } from "@/shared/lib/zod/schemas/rule";
import { Button } from "@/shared/ui/button";
import { ContentCard } from "@/shared/ui/content-card";
import { Icons } from "@/shared/ui/icons";
import { DeleteRuleDialog } from "../delete-rule-dialog";

type RuleCardProps = {
	rule: RuleListItemVo;
};

export function RuleCard({ rule }: RuleCardProps): JSX.Element {
	const router = useRouter();
	const [deleteOpen, setDeleteOpen] = useState(false);
	// 复制进行中标志：拉全文期间禁用点击 + 触发卡片 loading 蒙层
	const [isCopying, setIsCopying] = useState(false);

	// ! 复制：列表只有 120 字预览，必须先拉全文再写剪贴板
	const handleCopy = async (): Promise<void> => {
		setIsCopying(true);
		try {
			const { content } = await getRule(rule.id);
			copy(content);
			toast.success("已复制");
		} catch {
			toast.error("复制失败");
		} finally {
			setIsCopying(false);
		}
	};

	return (
		<ContentCard
			name={rule.name}
			preview={rule.preview}
			previewClassName="font-mono"
			onClick={handleCopy}
			clickAriaLabel="复制"
			isPending={isCopying}
			// > 底部 hover 遮罩的操作：查看详情（跳详情页）+ 编辑（跳编辑页）+ 删除（二次确认）
			actions={
				<>
					<Button
						variant="ghost"
						size="icon-sm"
						aria-label="查看详情"
						onClick={() => router.push(`/spec/personal/rules/${rule.id}`)}
					>
						<Icons.eye className="size-4" />
					</Button>
					<Button
						variant="ghost"
						size="icon-sm"
						aria-label="编辑"
						onClick={() => router.push(`/spec/personal/rules/${rule.id}?edit=1`)}
					>
						<Icons.pencil className="size-4" />
					</Button>
					<Button
						variant="ghost"
						size="icon-sm"
						aria-label="删除"
						onClick={() => setDeleteOpen(true)}
					>
						<Icons.trash className="size-4" />
					</Button>
				</>
			}
		>
			<DeleteRuleDialog rule={rule} open={deleteOpen} onOpenChange={setDeleteOpen} />
		</ContentCard>
	);
}

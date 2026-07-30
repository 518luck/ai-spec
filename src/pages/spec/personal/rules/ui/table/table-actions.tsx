"use client";

// # 规则行操作入口：「…」按钮触发下拉菜单，含编辑、删除；删除经 DeleteRuleDialog 二次确认

import { useRouter } from "next/navigation";
import type { JSX } from "react";
import { useState } from "react";

import type { RuleListItemVo } from "@/shared/lib/zod/schemas/rule";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { Icons } from "@/shared/ui/icons";
import { DeleteRuleDialog } from "../delete-rule-dialog";

type TableActionsProps = {
	rule: RuleListItemVo;
};

export function TableActions({ rule }: TableActionsProps): JSX.Element {
	const router = useRouter();
	const [deleteOpen, setDeleteOpen] = useState(false);

	// 跳转到编辑页面
	const handleEdit = (): void => {
		router.push(`/spec/personal/rules/${rule.id}/edit`);
	};

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger
					render={
						<button
							type="button"
							className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground"
							aria-label="更多操作"
						/>
					}
				>
					<Icons.more className="size-4" />
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					<DropdownMenuItem onClick={handleEdit}>
						<Icons.pencil data-icon="inline-start" />
						编辑
					</DropdownMenuItem>
					<DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>
						<Icons.trash data-icon="inline-start" />
						删除
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>

			<DeleteRuleDialog rule={rule} open={deleteOpen} onOpenChange={setDeleteOpen} />
		</>
	);
}

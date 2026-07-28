"use client";

// # 新建领域空间对话框：取个名字 + 挑一个图标，提交交给调用方落库

import { type JSX, useEffect, useState } from "react";

import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import {
	Dialog,
	DialogContent,
	DialogContentBody,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
	DEFAULT_SPACE_ICON_KEY,
	RULE_SPACE_ICON_OPTIONS,
	resolveSpaceIcon,
} from "../config/space-icons";

type CreateSpaceDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	// 打开时预填的名称（如来自搜索词），不传则为空
	initialName?: string;
	// 提交创建：传入空间名称与图标 key，由调用方全量校验后落库
	onSubmit: (input: { name: string; icon: string }) => Promise<void>;
};

export function CreateSpaceDialog({
	open,
	onOpenChange,
	initialName = "",
	onSubmit,
}: CreateSpaceDialogProps): JSX.Element {
	const [name, setName] = useState(initialName);
	const [icon, setIcon] = useState<string>(DEFAULT_SPACE_ICON_KEY);

	// 打开时同步预填名称、重置图标
	useEffect(() => {
		if (open) {
			setName(initialName);
			setIcon(DEFAULT_SPACE_ICON_KEY);
		}
	}, [open, initialName]);

	const handleSubmit = async (): Promise<void> => {
		await onSubmit({ name: name.trim(), icon });
	};

	const PreviewIcon = resolveSpaceIcon(icon);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent showCloseButton={false} className="sm:max-w-lg">
				<DialogHeader className="relative">
					<DialogTitle>新建领域空间</DialogTitle>
					<DialogDescription className="pr-16">
						领域空间之间彼此隔离，标签无法贯穿。
					</DialogDescription>
					<div className="absolute top-4 right-4 flex size-12 items-center justify-center rounded-lg bg-muted">
						<PreviewIcon className="size-6 text-muted-foreground" />
					</div>
				</DialogHeader>

				<DialogContentBody className="flex gap-4">
					{/* // 左侧：空间名称 */}
					<div className="flex min-w-0 flex-1 flex-col gap-2">
						<Label>空间名称</Label>
						<Input
							value={name}
							onChange={(e) => setName(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter") handleSubmit();
							}}
							placeholder="如：代码、创作、智能体"
							autoFocus
						/>
					</div>
					{/* // 右侧：图标选择 */}
					<div className="flex w-52 shrink-0 flex-col gap-2">
						<Label>图标</Label>
						<div className="grid grid-cols-4 gap-2">
							{RULE_SPACE_ICON_OPTIONS.map((option) => (
								<Button
									key={option.key}
									variant="ghost"
									size="icon-sm"
									aria-label={`选择图标 ${option.label}`}
									onClick={() => setIcon(option.key)}
									className={cn(
										"hover:scale-110",
										icon === option.key && "ring-2 ring-ring ring-offset-1 ring-offset-background",
									)}
								>
									<option.icon className="size-5" />
								</Button>
							))}
						</div>
					</div>
				</DialogContentBody>

				<DialogFooter>
					<Button className="w-full" onClick={handleSubmit}>
						创建
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

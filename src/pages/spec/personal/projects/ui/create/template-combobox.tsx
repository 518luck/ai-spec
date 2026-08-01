"use client";

// # 模板选择器：下拉搜索选模板

import { type JSX, useState } from "react";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/shared/ui/command";
import { Icons } from "@/shared/ui/icons";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import { PROJECT_TEMPLATES } from "./templates";

type TemplateComboboxProps = {
	templateKey: string;
	onTemplateChange: (key: string) => void;
};

// > 模板选择器：Popover + Command(cmdk) 搜索过滤
export function TemplateCombobox({
	templateKey,
	onTemplateChange,
}: TemplateComboboxProps): JSX.Element {
	const [open, setOpen] = useState(false);
	const template = PROJECT_TEMPLATES.find((t) => t.key === templateKey) ?? PROJECT_TEMPLATES[0];

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger
				render={
					<Button
						variant="outline"
						role="combobox"
						aria-expanded={open}
						className="w-full justify-between font-normal"
					/>
				}
			>
				<Icons.folderClosed className="size-4 shrink-0 text-muted-foreground" />
				<span className="min-w-0 truncate">{template.name}</span>
				<Icons.chevronDown
					className={cn(
						"ml-auto size-4 shrink-0 opacity-50 transition-transform",
						open && "rotate-180",
					)}
				/>
			</PopoverTrigger>
			<PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
				<Command>
					<CommandInput placeholder="搜索模板..." />
					<CommandList showMask className="max-h-72">
						<CommandEmpty>没有匹配的模板</CommandEmpty>
						<CommandGroup>
							{PROJECT_TEMPLATES.map((t) => (
								<CommandItem
									key={t.key}
									value={`${t.name} ${t.desc} ${t.key}`}
									onSelect={() => {
										onTemplateChange(t.key);
										setOpen(false);
									}}
									className="cursor-pointer bg-transparent! hover:bg-accent! hover:text-accent-foreground!"
								>
									<Icons.folderClosed className="size-4 shrink-0 text-muted-foreground" />
									<div className="flex min-w-0 flex-col">
										<span className="truncate text-sm">{t.name}</span>
										<span className="truncate text-muted-foreground text-xs">{t.desc}</span>
									</div>
									<Icons.check
										className={cn(
											"ml-auto size-4 shrink-0",
											templateKey === t.key ? "opacity-100" : "opacity-0",
										)}
									/>
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}

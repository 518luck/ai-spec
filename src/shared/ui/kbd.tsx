import { cn } from "@/shared/lib/utils";

type KbdProps = React.ComponentProps<"kbd"> & {
	// 与同行文字视觉对齐：kbd 的 h-5 固定盒比文字 x-height 中心偏高，开启后下移 1px 补偿
	// 仅用于「文字 + 等高 kbd」的内联场景（如按钮文字旁的快捷键），单独出现在 tooltip 里时不需要
	alignWithText?: boolean;
};

function Kbd({ className, alignWithText = false, ...props }: KbdProps) {
	return (
		<kbd
			data-slot="kbd"
			className={cn(
				"pointer-events-none inline-flex h-5 w-fit min-w-5 select-none items-center justify-center gap-1 rounded-sm bg-muted in-data-[slot=tooltip-content]:bg-background/20 px-1 font-medium font-sans in-data-[slot=tooltip-content]:text-background text-muted-foreground text-xs dark:in-data-[slot=tooltip-content]:bg-background/10 [&_svg:not([class*='size-'])]:size-3",
				alignWithText && "-translate-y-px",
				className,
			)}
			{...props}
		/>
	);
}

export { Kbd };

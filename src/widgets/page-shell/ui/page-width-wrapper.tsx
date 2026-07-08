import type { ReactNode } from "react";
import { cn } from "@/shared/lib/utils";

export function PageWidthWrapper({
	className,
	children,
}: {
	className?: string;
	children: ReactNode;
}) {
	return (
		<div className={cn("@container/page mx-auto w-full max-w-7xl px-3 pt-6 lg:px-6", className)}>
			<div className="rounded-lg border px-6 py-4">{children}</div>
		</div>
	);
}

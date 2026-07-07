"use client";

import type { JSX } from "react";
import { toast } from "sonner";

import { Button } from "@/shared/ui/button";
import { Kbd } from "@/shared/ui/kbd";

// 新建草稿入口按钮，创建流程后续接入
export function CreateDraftButton(): JSX.Element {
	const handleClick = (): void => {
		toast.info("新建草稿功能即将上线");
	};

	return (
		<Button size="sm" variant="outline" onClick={handleClick} className="gap-2">
			新建草稿
			<Kbd className="-translate-y-px">C</Kbd>
		</Button>
	);
}

"use client";

import type { JSX } from "react";
import { useState } from "react";

import { Button } from "@/shared/ui/button";
import { Kbd } from "@/shared/ui/kbd";

import { CreateDraftDialog } from "./create-draft-dialog";

// # 新建草稿入口按钮：点击打开创建弹窗
export function CreateDraftButton(): JSX.Element {
	const [open, setOpen] = useState(false);

	return (
		<>
			<Button size="sm" variant="outline" onClick={() => setOpen(true)} className="gap-2">
				新建草稿
				<Kbd className="-translate-y-px">C</Kbd>
			</Button>
			<CreateDraftDialog open={open} onOpenChange={setOpen} />
		</>
	);
}

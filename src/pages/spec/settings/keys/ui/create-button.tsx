"use client";

import type { JSX } from "react";
import { useState } from "react";

import { Button } from "@/shared/ui/button";

import { CreateDialog } from "./create-dialog";

// # 创建密钥入口按钮
// 创建新密钥入口；点击打开创建弹窗，生成流程后续接入
export function CreateButton(): JSX.Element {
	const [open, setOpen] = useState(false);

	return (
		<>
			<Button size="sm" onClick={() => setOpen(true)}>
				创建密钥
			</Button>
			<CreateDialog open={open} onOpenChange={setOpen} />
		</>
	);
}

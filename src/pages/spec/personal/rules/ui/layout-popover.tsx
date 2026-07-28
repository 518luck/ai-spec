"use client";

// # 规约布局弹出框：布局预设 PanelTrigger，菜单内容待补充

import type { JSX } from "react";

import { PanelTrigger } from "@/features/panel-trigger";

// > 布局壳：使用 layout 预设，菜单内容后续按需填充
export function LayoutPopover(): JSX.Element {
	return <PanelTrigger variant="layout" menu={<></>} />;
}

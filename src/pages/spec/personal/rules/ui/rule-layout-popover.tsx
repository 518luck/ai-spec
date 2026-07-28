"use client";

// # 规约布局弹出框：布局预设 FilterShell，菜单内容待补充

import type { JSX } from "react";

import { FilterShell } from "@/features/filter-combobox";

// > 布局壳：使用 layout 预设，菜单内容后续按需填充
export function RuleLayoutPopover(): JSX.Element {
	return <FilterShell variant="layout" menu={<></>} />;
}

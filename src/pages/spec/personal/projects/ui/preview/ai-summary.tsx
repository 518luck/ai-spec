"use client";

// # AI 总结占位区块：预留位置，后续接入真实 AI 总结能力

import type { JSX } from "react";

import { Icons } from "@/shared/ui/icons";

interface AiSummaryProps {
	projectId: string;
}

// > AI 总结占位：功能上线前展示提示文案
export function AiSummary({ projectId: _projectId }: AiSummaryProps): JSX.Element {
	return (
		<div className="px-6 py-4">
			<div className="flex items-center gap-2">
				<Icons.aiAgents className="size-4 text-muted-foreground" />
				<span className="font-medium text-sm">AI 总结</span>
			</div>
			<div className="mt-2 rounded-md border border-dashed p-4 text-muted-foreground text-sm">
				AI 总结功能即将上线，届时将自动生成项目概览与资源使用建议。
			</div>
		</div>
	);
}

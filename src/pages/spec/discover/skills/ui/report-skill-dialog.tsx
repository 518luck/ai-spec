"use client";

// # Skill 反馈弹窗：选择原因 + 可选备注，只收集不自动下架

import { type JSX, useEffect, useState } from "react";
import { toast } from "@/features/toast";
import { client } from "@/shared/lib/orpc/client";
import type { DiscoverSkillReportReason } from "@/shared/lib/zod/schemas/discover-skill";
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
import { Label } from "@/shared/ui/label";
import { RadioGroup, RadioGroupItem } from "@/shared/ui/radio-group";
import { Spinner } from "@/shared/ui/spinner";
import { Textarea } from "@/shared/ui/textarea";

// 反馈原因选项（展示文案与后端枚举对齐）
const REPORT_REASON_OPTIONS: { value: DiscoverSkillReportReason; label: string }[] = [
	{ value: "lowQuality", label: "质量差 / 没什么用" },
	{ value: "inappropriate", label: "不当或敏感内容" },
	{ value: "spam", label: "广告 / 灌水" },
	{ value: "licenseIssue", label: "协议或转载有问题" },
	{ value: "other", label: "其他" },
];

type ReportSkillDialogProps = {
	skillId: string;
	skillName: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	// 提交成功后通知卡片进入「已反馈」态
	onReported: (skillId: string) => void;
};

// # 反馈弹窗：帮助改进广场收录（收集-only）
export function ReportSkillDialog({
	skillId,
	skillName,
	open,
	onOpenChange,
	onReported,
}: ReportSkillDialogProps): JSX.Element {
	const [reason, setReason] = useState<DiscoverSkillReportReason>("lowQuality");
	const [detail, setDetail] = useState("");
	const [submitting, setSubmitting] = useState(false);

	// 关闭后重置表单，避免下次打开残留
	useEffect(() => {
		if (!open) {
			setReason("lowQuality");
			setDetail("");
			setSubmitting(false);
		}
	}, [open]);

	// > 提交反馈：成功 toast 并标记已反馈；冲突时提示已提交过
	const handleSubmit = async (): Promise<void> => {
		if (submitting) return;
		setSubmitting(true);
		try {
			await client.discoverSkills.report({
				id: skillId,
				reason,
				detail: detail.trim() || undefined,
			});
			toast.success("感谢反馈");
			onReported(skillId);
			onOpenChange(false);
		} catch (error) {
			toast.error(error instanceof Error && error.message ? error.message : "反馈失败，请稍后重试");
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent showCloseButton={false} className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>反馈此 Skill</DialogTitle>
					<DialogDescription>
						觉得「{skillName}」不太合适？告诉我们原因就好，我们会认真看看。
					</DialogDescription>
				</DialogHeader>

				<DialogContentBody className="space-y-4">
					<div className="space-y-2">
						<Label>反馈原因</Label>
						<RadioGroup
							value={reason}
							onValueChange={(value) => setReason(value as DiscoverSkillReportReason)}
							className="gap-2"
						>
							{REPORT_REASON_OPTIONS.map((option) => (
								<Label
									key={option.value}
									className="flex cursor-pointer items-center gap-2 rounded-md border border-transparent px-2 py-1.5 font-normal text-sm hover:bg-muted/60"
								>
									<RadioGroupItem value={option.value} />
									<span>{option.label}</span>
								</Label>
							))}
						</RadioGroup>
					</div>

					<div className="space-y-2">
						<Label htmlFor="report-skill-detail">补充说明（可选）</Label>
						<Textarea
							id="report-skill-detail"
							value={detail}
							onChange={(e) => setDetail(e.target.value)}
							placeholder="有助于我们理解问题，最多 500 字"
							maxLength={500}
							rows={3}
							disabled={submitting}
						/>
					</div>
				</DialogContentBody>

				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						disabled={submitting}
						onClick={() => onOpenChange(false)}
					>
						取消
					</Button>
					<Button type="button" disabled={submitting} onClick={() => void handleSubmit()}>
						{submitting ? <Spinner className="size-4" /> : "提交反馈"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

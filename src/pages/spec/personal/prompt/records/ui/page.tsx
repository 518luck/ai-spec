"use client";

import { useSession } from "next-auth/react";
import type { JSX } from "react";
import { useState } from "react";

import { Button } from "@/shared/ui/button";
import { Kbd } from "@/shared/ui/kbd";
import { PageWidthWrapper, ToolbarPageShell } from "@/widgets/page-shell";
import { CreateRecordDialog } from "./create-record-dialog";

// # 个人收录页占位（等待后续业务内容接入）
export function PersonalRecordsPage(): JSX.Element {
	const { status } = useSession();
	const [createOpen, setCreateOpen] = useState(false);

	return (
		<ToolbarPageShell
			title="收录"
			actions={
				status === "authenticated" ? (
					<>
						<Button
							size="sm"
							variant="outline"
							onClick={() => setCreateOpen(true)}
							className="gap-2"
						>
							创建收录
							<Kbd alignWithText>C</Kbd>
						</Button>
						<CreateRecordDialog open={createOpen} onOpenChange={setCreateOpen} />
					</>
				) : undefined
			}
		>
			<PageWidthWrapper fill>
				<div>收录</div>
			</PageWidthWrapper>
		</ToolbarPageShell>
	);
}

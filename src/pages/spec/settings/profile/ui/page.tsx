import type { JSX } from "react";

import { AvatarUploader } from "@/features/upload-avatar";
import { auth } from "@/shared/lib/auth/auth";
import { TitlePageShell } from "@/widgets/page-shell";

import { EmailFieldCard } from "./email-field-card";
import { NameFieldCard } from "./name-field-card";

// 渲染个人详情页面，以可编辑卡片展示名称（含头像）与邮箱
export async function ProfilePage(): Promise<JSX.Element> {
	// 服务端读取会话，避免 useSession 的 loading 闪烁
	const session = await auth();
	const user = session?.user;
	const name = user?.name?.trim() || "";
	const email = user?.email?.trim() || "";

	return (
		<TitlePageShell title="个人详情">
			<div className="flex flex-col gap-4">
				<NameFieldCard defaultValue={name} aside={<AvatarUploader className="size-24" />} />
				<EmailFieldCard defaultValue={email} />
			</div>
		</TitlePageShell>
	);
}

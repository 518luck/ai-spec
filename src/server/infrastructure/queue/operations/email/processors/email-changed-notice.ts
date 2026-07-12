import { sendEmail } from "@/server/infrastructure/email";
import EmailChangedNoticeTemplate from "@/server/infrastructure/email/templates/email-changed-notice";
import { appConfig } from "@/shared/configs/app.config";

import type { EmailChangedNoticeData } from "../types";

// # 处理器：向老邮箱发送变更成功通知，提醒非本人操作时的安全风险
export async function processEmailChangedNotice({
	to,
	newEmail,
}: EmailChangedNoticeData): Promise<void> {
	await sendEmail({
		subject: `${appConfig.appName} 邮箱已变更`,
		to,
		react: EmailChangedNoticeTemplate({ newEmail }),
	});
}

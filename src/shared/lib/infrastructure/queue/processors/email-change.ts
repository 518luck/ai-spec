import { appConfig } from "@/shared/configs/app.config";
import { sendEmail } from "@/shared/lib/infrastructure/email";
import EmailChangeTemplate from "@/shared/lib/infrastructure/email/templates/email-change";

import type { EmailChangeData } from "../types";

// 发送邮箱变更确认邮件，链接携带原始 token 指向前端验证页
export async function processEmailChange({
  to,
  token,
  oldEmail,
  newEmail,
}: EmailChangeData): Promise<void> {
  const baseUrl = process.env.NEXTAUTH_URL ?? "";
  const url = `${baseUrl}/verify-email-change?token=${token}`;

  await sendEmail({
    to,
    subject: `${appConfig.appName} 邮箱变更确认`,
    react: EmailChangeTemplate({ url, oldEmail, newEmail }),
  });
}

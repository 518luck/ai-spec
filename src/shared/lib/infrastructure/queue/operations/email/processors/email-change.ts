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
  const baseUrl = process.env.BASE_URL ?? "";
  const url = `${baseUrl}/spec/confirm-email-change/${token}`;
  const cancelUrl = `${baseUrl}/spec/confirm-email-change/${token}?cancel=true`;

  await sendEmail({
    subject: `${appConfig.appName} 邮箱变更确认`,
    to,
    react: EmailChangeTemplate({ url, cancelUrl, oldEmail, newEmail }),
  });
}

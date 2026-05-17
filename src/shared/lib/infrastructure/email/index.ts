import type { ResendEmailOptions } from "./resend/types";
import { sendEmailViaResend } from "./send-via-resend";
// TODO 单独拿出来多包一层,主要是想要在这里包裹一层回退邮箱
// 单个邮件发送
export const sendEmail = async (opts: ResendEmailOptions) => {
  return await sendEmailViaResend(opts);
};

// TODO 多封邮件发送

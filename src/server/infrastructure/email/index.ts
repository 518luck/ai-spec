import { getEmailProvider } from "./provider";
import type { ResendEmailOptions } from "./resend/types";
import type { SendResult } from "./types";

// # 邮件发送入口：委托给当前 provider 完成单封/批量发送

// 发送单封邮件（委托给当前 provider）
export const sendEmail = async (opts: ResendEmailOptions): Promise<SendResult> => {
	return await getEmailProvider().send(opts);
};

// 批量发送邮件（委托给当前 provider）
export const sendBatchEmail = async (emails: ResendEmailOptions[]): Promise<SendResult[]> => {
	return await getEmailProvider().sendBatch(emails);
};

export type {
	ResendBulkEmailOptions,
	ResendEmailOptions,
} from "./resend/types";
export type { EmailProvider, EmailProviderName, SendResult } from "./types";

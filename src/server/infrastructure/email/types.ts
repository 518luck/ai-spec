import type { ResendEmailOptions } from "./resend/types";

// 支持的邮件 provider 名称
export type EmailProviderName = "resend" | "mailpit";

// 归一化后的发送结果，屏蔽 Resend / SMTP 各自的返回差异
export interface SendResult {
	ok: boolean;
	id?: string;
	error?: unknown;
}

// 邮件 provider 统一契约：单封与批量发送
export interface EmailProvider {
	readonly name: EmailProviderName;
	send: (opts: ResendEmailOptions) => Promise<SendResult>;
	sendBatch: (emails: ResendEmailOptions[]) => Promise<SendResult[]>;
}

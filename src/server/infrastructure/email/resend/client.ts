import { Resend } from "resend";

// # Resend SDK 客户端：仅当配置了 API Key 时初始化
export const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

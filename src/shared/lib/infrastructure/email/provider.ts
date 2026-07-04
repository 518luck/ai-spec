import { mailpitProvider } from "./mailpit/send";
import { resendProvider } from "./resend/send";
import type { EmailProvider, EmailProviderName } from "./types";

// provider 注册表
const PROVIDERS: Record<EmailProviderName, EmailProvider> = {
  resend: resendProvider,
  mailpit: mailpitProvider,
};

// 根据环境变量选择 provider，缺省 resend（生产环境）
const resolveProviderName = (): EmailProviderName => {
  const name = process.env.EMAIL_PROVIDER as EmailProviderName | undefined;
  return name && name in PROVIDERS ? name : "resend";
};

let cached: EmailProvider | null = null;

// 获取当前邮件 provider（首次解析后缓存）
export const getEmailProvider = (): EmailProvider => {
  if (!cached) {
    cached = PROVIDERS[resolveProviderName()];
  }
  return cached;
};

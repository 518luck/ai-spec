import type { CreateEmailOptions } from "resend";
import type { EmailProvider, SendResult } from "../types";
import { resend } from "./client";
import { VARIANT_TO_FROM_MAP } from "./constants";
import type { ResendEmailOptions } from "./types";

// 未配置 API Key 时的跳过结果
const skipped = (reason: string): SendResult => ({
  ok: false,
  error: reason,
});

// 将统一 options 转为 Resend SDK 所需格式
const toResendOptions = (opts: ResendEmailOptions): CreateEmailOptions => {
  const {
    to,
    from,
    variant = "primary",
    bcc,
    replyTo,
    subject,
    text,
    react,
    scheduledAt,
    headers,
    tags,
    unsubscribeUrl,
  } = opts;

  const baseOptions = {
    to,
    from: from ?? VARIANT_TO_FROM_MAP[variant],
    bcc,
    ...(replyTo === "noreply" ? {} : { replyTo: replyTo || "support@dub.co" }),
    subject: subject ?? "",
    scheduledAt,
    ...(variant === "marketing"
      ? {
          headers: {
            ...(headers || {}),
            "List-Unsubscribe": unsubscribeUrl || "https://spec.luckyun.shop/account/settings",
          },
        }
      : headers && { headers }),
    tags,
  };

  if (react) {
    return { ...baseOptions, react };
  }
  if (text) {
    return { ...baseOptions, text };
  }

  return { ...baseOptions, text: "" };
};

// Resend provider：通过 Resend SDK 发送真实邮件
export const resendProvider: EmailProvider = {
  name: "resend",

  // 发送单封邮件
  send: async (opts: ResendEmailOptions): Promise<SendResult> => {
    if (!resend) {
      console.warn(".env 配置文件中未设置 RESEND_API_KEY。已跳过发送邮件的操作。");
      return skipped("RESEND_API_KEY 未设置");
    }

    const result = await resend.emails.send(toResendOptions(opts));

    return {
      ok: !result.error,
      id: result.data?.id,
      error: result.error ?? undefined,
    };
  },

  // 批量发送：一人一封，一次调用发出多封不同邮件
  sendBatch: async (emails: ResendEmailOptions[]): Promise<SendResult[]> => {
    if (!resend) {
      console.warn(".env 配置文件中未设置 RESEND_API_KEY。已跳过发送邮件的操作。");
      return emails.map(() => skipped("RESEND_API_KEY 未设置"));
    }

    if (emails.length === 0) {
      return [];
    }

    // 过滤掉没有收件人地址的邮件，并保留原始索引用于结果对齐
    const indexed = emails
      .map((email, index) => ({ email, index }))
      .filter(({ email }) => Boolean(email?.to));

    if (indexed.length === 0) {
      return [];
    }

    const filteredBatch = indexed.map(({ email }) => toResendOptions(email));

    const result = await resend.batch.send(filteredBatch);
    const ok = !result.error;

    return indexed.map((_, i) => ({
      ok,
      id: result.data?.data?.[i]?.id,
      error: result.error ?? undefined,
    }));
  },
};

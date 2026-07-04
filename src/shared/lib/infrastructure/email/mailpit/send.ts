import { render } from "react-email";
import { VARIANT_TO_FROM_MAP } from "../resend/constants";
import type { ResendEmailOptions } from "../resend/types";
import type { EmailProvider, SendResult } from "../types";
import { mailpitTransport } from "./client";

// 未提供收件人时的跳过结果
const skipped = (reason: string): SendResult => ({
  ok: false,
  error: reason,
});

// 解析发件人地址，缺省时按 variant 取对应模板发件人
const resolveFrom = (opts: ResendEmailOptions): string =>
  opts.from ?? VARIANT_TO_FROM_MAP[opts.variant ?? "primary"];

// 将 react 邮件组件渲染为 HTML 字符串，供 SMTP 协议传输
const renderHtml = async (opts: ResendEmailOptions): Promise<string> => {
  if (opts.react) {
    return await render(opts.react);
  }
  return "";
};

// 发送单封邮件到 Mailpit
const sendOne = async (opts: ResendEmailOptions): Promise<SendResult> => {
  if (!opts.to) {
    return skipped("缺少收件人地址");
  }

  const html = await renderHtml(opts);

  const info = await mailpitTransport.sendMail({
    from: resolveFrom(opts),
    to: opts.to,
    subject: opts.subject ?? "",
    ...(html ? { html } : {}),
    ...(opts.text ? { text: opts.text } : {}),
    ...(opts.cc ? { cc: opts.cc } : {}),
    ...(opts.bcc ? { bcc: opts.bcc } : {}),
    ...(opts.replyTo && opts.replyTo !== "noreply" ? { replyTo: opts.replyTo } : {}),
    ...(opts.headers ? { headers: opts.headers } : {}),
  });

  return { ok: true, id: info.messageId };
};

// Mailpit provider：本地 SMTP 捕获，供开发期查看邮件效果
export const mailpitProvider: EmailProvider = {
  name: "mailpit",
  send: sendOne,

  // 批量发送：SMTP 无原生批量能力，逐封发送
  sendBatch: async (emails: ResendEmailOptions[]): Promise<SendResult[]> => {
    const results: SendResult[] = [];
    for (const email of emails) {
      results.push(await sendOne(email));
    }
    return results;
  },
};

import type { CreateEmailOptions } from "resend";
import type { ResendEmailOptions } from "./resend/types";
import { VARIANT_TO_FROM_MAP } from "./resend/constants";

const resendEmailForOptions = (
  opts: ResendEmailOptions,
): CreateEmailOptions => {
  const {
    to, // 收件人邮箱地址
    from, // 发件人邮箱地址
    variant = "primary", // 邮件模板变体: primary: 主要邮件模板 | notifications:通知类邮件模板 | marketing:营销类邮件模板
    bcc, // 密送收件人
    replyTo, // 回复地址
    subject, // 邮件标题
    text, // 纯文本内容
    react, // React 邮件组件
    scheduledAt, // 定时发送时间
    headers, // 自定义邮件头
    tags, // 邮件标签(用于分类/统计)
    unsubscribeUrl, // 自定义退订URL(列表退订头)
  } = opts;

  const baseOptions = {
    to,
    from: from ?? VARIANT_TO_FROM_MAP[variant],
    bcc,
    ...(replyTo === "noreply" ? {} : { replyTo: replyTo || "support@dub.co" }),
    subject: `${subject}${subject ? ` [${subject}]` : ""}`,
    scheduledAt,
    ...(variant === "marketing"
      ? {
          headers: {
            ...(headers || {}),
            //，Gmail/Outlook 等服务商识别到后，会在界面自动显示退订按钮
            "List-Unsubscribe":
              unsubscribeUrl || "https://spec.luckyun.shop/account/settings",
          },
        }
      : headers && { headers }),
    tags,
  };

  //react 和 text 是邮件正文内容，二选一必须有一个
  if (react) {
    return { ...baseOptions, react };
  }
  if (text) {
    return { ...baseOptions, text };
  }

  return { ...baseOptions, text: "" };
};

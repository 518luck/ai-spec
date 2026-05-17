import type { CreateEmailOptions } from "resend";
import type {
  ResendBulkEmailOptions,
  ResendEmailOptions,
} from "./resend/types";
import { VARIANT_TO_FROM_MAP } from "./resend/constants";
import { resend } from "./resend/client";

// 转换 resend options
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
    subject: subject ?? "",
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

// 单封发送
export const sendEmailViaResend = async (opts: ResendEmailOptions) => {
  if (!resend) {
    console.warn(
      ".env 配置文件中未设置 RESEND_API_KEY。已跳过发送邮件的操作。",
    );
    return;
  }

  // resend.emails.send(...)       // 发单封邮件
  // resend.emails.get(...)        // 查某封邮件
  // resend.domains.create(...)    // 创建发信域名
  // resend.domains.list(...)      // 查看域名
  // resend.contacts.create(...)   // 创建联系人
  // resend.broadcasts.send(...)   // 发送广播邮件
  // resend.webhooks.list(...)     // 查看 Webhook
  // resend.apiKeys.list(...)      // 查看 API Key
  return await resend.emails.send(resendEmailForOptions(opts));
};

//  一人一封，批量发送多封不同的邮件
// 比如：用户 A 发"密码重置"，用户 B 发"欢迎注册"——一次调用，两封不同邮件同时发出
export const sendBatchEmailViaResend = async (
  emails: ResendBulkEmailOptions,
  //idempotencyKey（幂等键），防止重复发送
  options?: { idempotencyKey?: string },
) => {
  if (!resend) {
    console.warn(
      ".env 配置文件中未设置 RESEND_API_KEY。已跳过发送邮件的操作。",
    );
    // 保持返回结构一致。正常发送成功时 resend.batch.send() 也返回 { data, error }
    return {
      data: null,
      error: null,
    };
  }

  if (emails.length === 0) {
    return {
      data: null,
      error: null,
    };
  }

  // 过滤掉没有收件人地址的邮件，并格式化为 Resend 所需格式
  // 语法
  // array.reduce((累积值, 当前元素) => { ... }, 初始值)
  const filteredBatch = emails.reduce(
    (acc, email) => {
      // 过滤掉没有收件人地址的邮件
      if (!email?.to) {
        return acc;
      }

      acc.push(resendEmailForOptions(email));

      return acc;
    },
    // 如果以后改了 resendEmailForOptions 的返回值，这里不用手动同步改。
    // ReturnType<> TypeScript 内置工具类型，提取函数返回值的类型
    [] as ReturnType<typeof resendEmailForOptions>[],
  );

  if (filteredBatch.length === 0) {
    return {
      data: null,
      error: null,
    };
  }

  const idempotencyKey = options?.idempotencyKey || undefined;

  return await resend.batch.send(
    filteredBatch,
    idempotencyKey ? { idempotencyKey } : undefined,
  );
};

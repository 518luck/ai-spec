// 描述"一封邮件由哪些字段构成
import type { CreateEmailOptions } from "resend";

export interface ResendEmailOptions
  //  \extends 继承 Resend 的所有字段（subject、html、cc 等）
  extends Omit<CreateEmailOptions, "to" | "from"> {
  to: string;
  from?: string;
  variant?: "primary" | "notifications" | "marketing";
  unsubscribeUrl?: string; // 自定义退订URL列表退订头
}

export type ResendBulkEmailOptions = ResendEmailOptions[];

// Resend SDK 内置的类型，描述"查询域名验证状态"接口返回的数据结构，大概是：
// interface GetDomainResponseSuccess {
//   id: string;
//   name: string;           // 域名
//   status: "pending" | "verified" | "failed";  // DNS 验证状态
//   region: string;         // 区域
//   created_at: string;
//   records: {              // 需要配置的 DNS 记录
//     type: string;
//     name: string;
//     value: string;
//     status: "not_started" | "pending" | "verified";
//   }[];
// }
export type { GetDomainResponseSuccess } from "resend";

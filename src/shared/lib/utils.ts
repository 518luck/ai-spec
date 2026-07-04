import { compare, hash } from "bcryptjs";

// lib 是整个工具箱什么都能放（工具/配置/适配/类型/auth…）utils：只放纯函数工具
// shadcn/ui 的工具函数，用于智能合并 Tailwind CSS 类名
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

//  从一个完整 URL 字符串里，把查询参数提取出来，转换成普通对象返回。
export const getSearchParams = (url: string) => {
  // Create a params object
  const params = {} as Record<string, string>;

  // new url是 JS 自带的 URL 类。   把一个完整 URL 字符串解析成结构化对象。
  new URL(url).searchParams.forEach((val, key) => {
    params[key] = val;
  });

  return params;
};

// 将过长字符串截断到指定长度，并用省略号结尾。
export const truncate = (str: string | null | undefined, length: number): string | null => {
  if (!str || str.length <= length) return str ?? null;
  return `${str.slice(0, length - 3)}...`;
};

// 密码哈希
export async function hashPassword(password: string) {
  return await hash(password, 12);
}

// 拿用户这次输入的明文密码，和数据库里的 passwordHash 做比较
export async function validatePassword({
  password,
  passwordHash,
}: {
  password: string;
  passwordHash: string;
}) {
  return await compare(password, passwordHash);
}

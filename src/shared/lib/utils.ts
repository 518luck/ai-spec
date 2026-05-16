// shadcn/ui 的工具函数，用于智能合并 Tailwind CSS 类名
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

//  从一个完整 URL 字符串里，把查询参数提取出来，转换成普通对象返回。
export const getSearchParams = (url: string) => {
  // Create a params object
  const params = {} as Record<string, string>;

  // new url是 JS 自带的 URL 类。   把一个完整 URL 字符串解析成结构化对象。
  new URL(url).searchParams.forEach(function (val, key) {
    params[key] = val;
  });

  return params;
};

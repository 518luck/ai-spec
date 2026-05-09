// shadcn/ui 的工具函数，用于智能合并 Tailwind CSS 类名
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

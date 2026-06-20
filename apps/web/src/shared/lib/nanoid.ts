import { customAlphabet } from "nanoid";

// 纯字母数字（0-9A-Za-z）短随机串生成器，默认 7 位
const generate = customAlphabet(
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  7,
);

// 生成纯字母数字短随机串，传入 length 覆盖默认长度
export const nanoid = (length?: number): string => generate(length);

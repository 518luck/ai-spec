import { Md5 } from "ts-md5";

const GRAVATAR_BASE = "https://www.gravatar.com/avatar/";

// 头像计算所需的用户字段
export type AvatarUser = {
  image?: string | null;
  email?: string | null;
};

// 根据邮箱生成 Gravatar 头像 URL，d=404 使邮箱无 Gravatar 时返回 404 以触发 Avatar fallback
export const buildGravatarUrl = (email: string): string => {
  const hash = Md5.hashStr(email.trim().toLowerCase());
  return `${GRAVATAR_BASE}${hash}?d=404`;
};

// 计算用户头像地址：优先自定义头像，其次 Gravatar，都没有时返回 undefined 交由占位图标兜底
export const getUserAvatarUrl = (
  user?: AvatarUser | null,
): string | undefined => {
  if (user?.image) {
    return user.image;
  }
  if (user?.email) {
    return buildGravatarUrl(user.email);
  }
  return undefined;
};

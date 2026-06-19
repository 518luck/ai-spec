"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

import { updateUserAvatar } from "../api/update-user-avatar";

// 头像上传编排：选文件 → 开裁剪弹窗 → 提交 → 刷新 session 与路由
export const useAvatarUpload = () => {
  const { update } = useSession();
  const router = useRouter();

  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isCropOpen, setIsCropOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 文件选定后打开裁剪弹窗
  const onFileSelected = ({ src }: { src: string }): void => {
    setImageSrc(src);
    setIsCropOpen(true);
  };

  // 裁剪确认后提交：写库 → 刷新 session → 刷新路由 → 提示
  const onConfirm = async (dataUrl: string): Promise<void> => {
    setIsSubmitting(true);
    try {
      await updateUserAvatar(dataUrl);
      // update 触发 jwt callback 的 trigger=update 分支重读 DB image
      await update({});
      // 让 profile 等服务端组件用新 token 重渲染
      router.refresh();
      toast.success("头像已更新");
      setIsCropOpen(false);
      setImageSrc(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "头像更新失败");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 取消裁剪
  const cancel = (): void => {
    setIsCropOpen(false);
    setImageSrc(null);
  };

  return {
    imageSrc,
    isCropOpen,
    isSubmitting,
    onFileSelected,
    onConfirm,
    cancel,
  };
};

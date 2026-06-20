"use client";

import { useSession } from "next-auth/react";

import { UserAvatar } from "@/entities/user";
import { cn } from "@/shared/lib/utils";
import { FileUpload } from "@/shared/ui/file-upload";
import { Icons } from "@/shared/ui/icons";

import { useAvatarUpload } from "../model/use-avatar-upload";
import { AvatarCropDialog } from "./avatar-crop-dialog";

type AvatarUploaderProps = {
  className?: string;
};

// 头像上传入口：可点击的头像 + 隐藏文件选择 + 裁剪弹窗编排
export function AvatarUploader({
  className,
}: AvatarUploaderProps): React.JSX.Element {
  const { data: session } = useSession();
  const {
    imageSrc,
    isCropOpen,
    isSubmitting,
    onFileSelected,
    onConfirm,
    cancel,
  } = useAvatarUpload();

  return (
    <>
      <FileUpload
        accept="images"
        readFile
        variant="plain"
        icon={Icons.avatarEdit}
        content="更换头像"
        loading={isSubmitting}
        disabled={isSubmitting}
        maxFileSizeMB={2}
        accessibilityLabel="上传头像"
        // 始终传真值以触发 hover 遮罩并持续渲染当前头像；实际内容由 customPreview 决定
        imageSrc={session?.user?.image ?? "avatar"}
        customPreview={<UserAvatar user={session?.user} className="size-full" />}
        onChange={onFileSelected}
        className={cn("rounded-full", className)}
      />

      {imageSrc ? (
        <AvatarCropDialog
          open={isCropOpen}
          imageSrc={imageSrc}
          onOpenChange={(open) => {
            if (!open) {
              cancel();
            }
          }}
          onConfirm={onConfirm}
        />
      ) : null}
    </>
  );
}

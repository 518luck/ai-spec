"use client";

import type { JSX } from "react";
import { toast } from "sonner";

import { Button } from "@/shared/ui/button";

type DeleteKeyButtonProps = {
  name: string;
};

// 删除密钥入口；本次仅 UI，删除逻辑后续接入
export function DeleteKeyButton({ name }: DeleteKeyButtonProps): JSX.Element {
  // 点击给出占位提示，真正的删除逻辑待后续实现
  const handleClick = (): void => {
    toast.info(`删除「${name}」功能即将上线`);
  };

  return (
    <Button variant="ghost" size="sm" onClick={handleClick}>
      删除
    </Button>
  );
}

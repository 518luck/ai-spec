"use client";

import type { JSX } from "react";
import { toast } from "sonner";

import { Button } from "@/shared/ui/button";
import { Icons } from "@/shared/ui/icons";

// 创建新密钥入口；本次仅 UI，生成流程后续接入
export function CreateKeyButton(): JSX.Element {
  // 点击给出占位提示，真正的创建逻辑待后续实现
  const handleClick = (): void => {
    toast.info("创建密钥功能即将上线");
  };

  return (
    <Button size="sm" onClick={handleClick}>
      <Icons.key />
      创建密钥
    </Button>
  );
}

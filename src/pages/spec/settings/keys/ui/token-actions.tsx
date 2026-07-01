"use client";

import { EllipsisIcon, PencilIcon, Trash2Icon } from "lucide-react";
import type { JSX } from "react";
import { toast } from "sonner";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

type TokenActionsProps = {
  name: string;
};

// 密钥行操作入口：「...」按钮触发下拉菜单，含编辑、删除两项；本次仅 UI，真实逻辑后续接入
export function TokenActions({ name }: TokenActionsProps): JSX.Element {
  // 编辑：占位提示，编辑表单后续实现
  const handleEdit = (): void => {
    toast.info(`编辑「${name}」功能即将上线`);
  };

  // 删除：占位提示，删除调用后续接入（预计配合 AlertDialog 二次确认）
  const handleDelete = (): void => {
    toast.info(`删除「${name}」功能即将上线`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground inline-flex size-7 items-center justify-center rounded-md transition-colors"
            aria-label="更多操作"
          />
        }
      >
        <EllipsisIcon className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleEdit}>
          <PencilIcon data-icon="inline-start" />
          编辑
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onClick={handleDelete}>
          <Trash2Icon data-icon="inline-start" />
          删除
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

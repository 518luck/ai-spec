"use client";

import { EllipsisIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useRouter } from "next/navigation";
import type { JSX } from "react";
import { toast } from "sonner";

import { deleteTokenAction } from "@/shared/lib/ohs/local/appservice/token/delete-token";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

type TokenActionsProps = {
  id: string;
  name: string;
};

// 密钥行操作入口：「...」按钮触发下拉菜单，含编辑、删除；删除走 deleteTokenAction，成功后刷新列表
export function TokenActions({ id, name }: TokenActionsProps): JSX.Element {
  const router = useRouter();
  const { executeAsync } = useAction(deleteTokenAction, {
    onSuccess: () => {
      toast.success("已删除");
      router.refresh();
    },
    onError: ({ error }) => {
      toast.error(error.serverError || "删除失败，请稍后重试");
    },
  });

  // 编辑：占位提示，编辑表单后续实现
  const handleEdit = (): void => {
    toast.info(`编辑「${name}」功能即将上线`);
  };

  // 删除：调用 Server Action，归属/存在校验在后端完成
  const handleDelete = (): void => {
    void executeAsync({ id });
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

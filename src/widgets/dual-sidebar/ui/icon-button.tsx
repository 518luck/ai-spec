"use client";

import type { JSX, ReactNode } from "react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";

type IconButtonProps = {
  label: string;
  onClick: () => void;
  // 传入则用 Tooltip 包裹按钮，悬停显示提示
  tooltip?: string;
  // tooltip 弹出延迟（ms），默认 500ms，避免快速划过时频繁弹出
  tooltipDelay?: number;
  children: ReactNode;
};

// 标题行图标按钮（收缩/展开/重置宽度），统一尺寸与交互态；传入 tooltip 则用 Tooltip 包裹
export function IconButton({
  label,
  onClick,
  tooltip,
  tooltipDelay = 500,
  children,
}: IconButtonProps): JSX.Element {
  const button = (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex size-7 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
    >
      {children}
    </button>
  );

  // 未提供提示文案时直接渲染按钮，保持调用简洁
  if (tooltip === undefined) {
    return button;
  }

  return (
    <Tooltip>
      <TooltipTrigger render={button} delay={tooltipDelay} />
      <TooltipContent side="bottom" showArrow={false}>
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
}

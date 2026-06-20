"use client";

import type { PropsWithChildren } from "react";

import { cn } from "@/shared/lib/utils";

// 单个右侧 area 的动画容器。
export function AnimatedArea({
  visible,
  direction,
  children,
}: PropsWithChildren<{ visible: boolean; direction: "left" | "right" }>) {
  return (
    <div
      className={cn(
        "flex size-full flex-col transition-[opacity,translate] duration-300",
        visible
          ? "relative opacity-100"
          : cn(
              "pointer-events-none absolute opacity-0",
              direction === "left" ? "-translate-x-full" : "translate-x-full",
            ),
      )}
      aria-hidden={!visible ? "true" : undefined}
      inert={!visible}
    >
      {children}
    </div>
  );
}

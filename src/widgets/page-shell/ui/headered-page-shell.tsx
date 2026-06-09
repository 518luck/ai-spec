import type { ComponentProps, JSX, ReactNode } from "react";

import { cn } from "@/shared/lib/utils";

type HeaderedPageShellProps = ComponentProps<"div"> & {
  title?: ReactNode;
};

// 提供可选标题栏和可滚动正文区的页面内容外壳。
export function HeaderedPageShell({
  title,
  className,
  children,
  ...props
}: HeaderedPageShellProps): JSX.Element {
  return (
    <div
      data-slot="headered-page-shell"
      className={cn("flex h-full min-h-0 flex-col", className)}
      {...props}
    >
      {title ? (
        <div
          data-slot="headered-page-shell-header"
          className="flex h-16 shrink-0 items-center border-b px-6"
        >
          {typeof title === "string" ? (
            <h1 className="text-lg font-semibold">{title}</h1>
          ) : (
            title
          )}
        </div>
      ) : null}

      <div
        data-slot="headered-page-shell-body"
        className="no-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto p-6"
      >
        {children}
      </div>
    </div>
  );
}

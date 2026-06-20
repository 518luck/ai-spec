import type { JSX } from "react";

// 简单的状态提示区块：标题 + 描述，用于邮箱变更各终态展示
export function StatusMessage({
  title,
  description,
}: {
  title: string;
  description: string;
}): JSX.Element {
  return (
    <div className="w-full max-w-sm text-center">
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="mt-6 text-sm font-medium text-neutral-500">{description}</p>
    </div>
  );
}

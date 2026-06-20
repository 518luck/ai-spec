import { CircleCheckFill } from "@/shared/assets/icons";
import { cn } from "@/shared/lib/utils";
import { memo } from "react";
import { useFormContext, useWatch } from "react-hook-form";

const REQUIREMENTS: {
  name: string;
  check: (password: string) => boolean;
}[] = [
  {
    name: "数字",
    check: (p) => /\d/.test(p),
  },
  {
    name: "大写字母",
    check: (p) => /[A-Z]/.test(p),
  },
  {
    name: "小写字母",
    check: (p) => /[a-z]/.test(p),
  },
  {
    name: "至少 8 位",
    check: (p) => p.length >= 8,
  },
];

/**
 * 显示密码要求以及密码字段是否满足各项要求的组件。
 *
 * 注意：此组件必须在 FormProvider 上下文中使用。
 */
export const PasswordRequirements = memo(function PasswordRequirements({
  field = "password",
  className,
}: {
  field?: string;
  className?: string;
}) {
  const {
    formState: { errors },
  } = useFormContext();
  const password = useWatch({ name: field });

  return (
    <ul
      className={cn(
        "mt-2 flex flex-wrap items-center justify-between gap-3",
        className,
      )}
    >
      {REQUIREMENTS.map(({ name, check }) => {
        const checked = password?.length && check(password);

        return (
          <li
            key={name}
            className={cn(
              "flex items-center gap-1 text-xs text-neutral-400 transition-colors",
              checked ? "text-green-600" : errors[field] && "text-red-600",
            )}
          >
            <CircleCheckFill
              className={cn(
                "size-2.5 transition-opacity",
                checked
                  ? "animate-scale-in direction-[alternate] animation-duration-[150ms] repeat-2 [--from-scale:1] [--to-scale:1.2] [animation-timing-function:ease-in-out]"
                  : errors[field]
                    ? "text-red-600"
                    : "text-neutral-200",
              )}
            />
            <span>{name}</span>
          </li>
        );
      })}
    </ul>
  );
});

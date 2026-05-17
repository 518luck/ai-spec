"use client";

import { useMediaQuery } from "@/shared/hooks/use-media-query";
import { sendOtpAction } from "@/shared/lib/actions/send-otp";
import { signUpSchema } from "@/shared/lib/zod/schemas/auth";
import { Button } from "@/shared/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAction } from "next-safe-action/hooks"; // 把 server action 变成客户端可调用的 hook
import { type SubmitEvent, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { useRegisterContext } from "../model/register-context";

type SignUpProps = z.infer<typeof signUpSchema>;

export function SignUpEmail() {
  const { isMobile } = useMediaQuery();

  const { setStep, setEmail, setPassword, email } = useRegisterContext();

  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<SignUpProps>({
    defaultValues: {
      email,
    },
    resolver: zodResolver(signUpSchema),
  });

  const { executeAsync, isPending } = useAction(sendOtpAction, {
    onSuccess: () => {
      setEmail(getValues("email"));
      setPassword(getValues("password"));
      setStep("verify");
    },
    onError: ({ error }) => {
      toast.error(
        error.serverError ||
          error.validationErrors?.email?.[0] ||
          error.validationErrors?.password?.[0],
      );
    },
  });

  const onSubmit = (e: SubmitEvent) => {
    const { email, password } = getValues();

    if (email && !password && !showPassword) {
      e.preventDefault(); // 阻止表单默认提交行为
      e.stopPropagation(); // 阻止事件继续冒泡
      setShowPassword(true);
      return;
    }

    handleSubmit(async (data) => {
      await executeAsync(data);
    })(e);
  };

  return (
    <form onSubmit={onSubmit}>
      <FieldSet>
        <FieldGroup>
          <Field data-invalid={!!errors?.email}>
            <FieldLabel>邮箱</FieldLabel>
            <Input
              type="email" /* 使用邮箱输入类型，浏览器会按邮箱格式处理 */
              placeholder="your-email@example.com" /* 输入框为空时展示的提示文本 */
              autoComplete="email" /* 允许浏览器自动填充邮箱 */
              required /* HTML 原生必填校验 */
              autoFocus={
                !isMobile && showPassword
              } /* 非移动端且显示密码框时自动聚焦 */
              {...register("email")}
              aria-invalid={
                !!errors?.email
              } /* 告诉辅助技术当前邮箱字段是否校验失败 */
            />
            <FieldError errors={[errors.email]} />
          </Field>

          {showPassword && (
            <Field data-invalid={!!errors?.password}>
              <FieldLabel>密码</FieldLabel>
              <Input
                type="password"
                placeholder="password"
                autoComplete="password"
                required
                autoFocus={!isMobile && showPassword}
                {...register("password")}
                aria-invalid={!!errors?.password}
              />
              <FieldError errors={[errors.password]} />
            </Field>
          )}
        </FieldGroup>
      </FieldSet>

      <Button type="submit" disabled={isPending} aria-busy={isPending}>
        {isPending ? "注册中..." : "注册"}
      </Button>
    </form>
  );
}

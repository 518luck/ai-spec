"use client";

import { useMediaQuery } from "@/shared/hooks/use-media-query";
import { sendOtpAction } from "@/shared/lib/actions/send-otp";
import { Button } from "@/shared/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { useAction } from "next-safe-action/hooks"; // 把 server action 变成客户端可调用的 hook
import { useState } from "react";
import { useForm } from "react-hook-form";

export function SignUpEmail() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const [showPassword, setShowPassword] = useState(false);

  const { isMobile } = useMediaQuery();

  const sendOtp = useAction(sendOtpAction);

  return (
    <form>
      <FieldSet>
        <FieldGroup>
          <Field data-invalid={!!errors?.email}>
            <FieldLabel>邮箱</FieldLabel>
            <Input
              type="email"
              placeholder="panic@thedis.co"
              autoComplete="email"
              required
              autoFocus={!isMobile && showPassword}
              {...register("email")}
              aria-invalid={!!errors?.email}
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

      <Button
        type="submit"
        // text={isPending ? "Submitting..." : "Sign Up"}
        // disabled={isPending}
        // loading={isPending}
      />
    </form>
  );
}

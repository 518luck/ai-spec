"use client";

import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldSet,
  FieldError,
} from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { useForm } from "react-hook-form";
import { useMediaQuery } from "@/shared/hooks/use-media-query";
import { useState } from "react";
import { Button } from "@/shared/ui/button";

export function SignUpEmail() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const [showPassword, setShowPassword] = useState(false);

  const { isMobile } = useMediaQuery();

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

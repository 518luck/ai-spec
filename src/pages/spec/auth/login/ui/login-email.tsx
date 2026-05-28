"use client";

import { Button } from "@/shared/ui/button";
import { Field, FieldGroup, FieldLabel, FieldSet } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import type { FormEvent, JSX } from "react";
import {
  email as emailMethod,
  password as passwordField,
  useLoginContext,
} from "../model/login-context";

// 预留邮箱密码登录接口，后端接入前保持无副作用。
const loginWithEmail = async (): Promise<void> => {};

// 渲染邮箱登录表单并按需展开密码输入框。
export function LoginEmail(): JSX.Element {
  const {
    email,
    password,
    preferredMethod,
    showPasswordField,
    setEmail,
    setPassword,
    setShowPasswordField,
    setPreferredMethod,
  } = useLoginContext();

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();

    if (!password) {
      setShowPasswordField(true);
      return;
    }

    setPreferredMethod(emailMethod);
    void loginWithEmail();
  };

  return (
    <form onSubmit={handleSubmit}>
      <FieldSet>
        <FieldGroup className="gap-4">
          <Field>
            <FieldLabel htmlFor="login-email">邮箱</FieldLabel>
            <Input
              id="login-email"
              name={emailMethod}
              type="email"
              placeholder="your-email@example.com"
              autoComplete="email"
              required
              value={email}
              onChange={({ target }) => setEmail(target.value)}
            />
          </Field>

          {showPasswordField && (
            <Field>
              <FieldLabel htmlFor="login-password">密码</FieldLabel>
              <Input
                id="login-password"
                name={passwordField}
                type={passwordField}
                placeholder="password"
                autoComplete="current-password"
                required
                autoFocus
                value={password}
                onChange={({ target }) => setPassword(target.value)}
              />
            </Field>
          )}
        </FieldGroup>
      </FieldSet>

      <Button className="mt-4 w-full" type="submit">
        登录
      </Button>
      {preferredMethod === emailMethod && (
        <p className="mt-2 text-center text-xs font-medium text-muted-foreground">
          你上次使用邮箱登录的
        </p>
      )}
    </form>
  );
}

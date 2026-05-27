"use client";

import { Google } from "@/shared/assets/icons";
import { Button } from "@/shared/ui/button";
import { Spinner } from "@/shared/ui/spinner";
import { signIn } from "next-auth/react";
import type { JSX } from "react";
import { useState } from "react";
import { google, useLoginContext } from "../model/login-context";

// 渲染 Google 第三方登录入口并记录用户偏好。
export function LoginGoogle(): JSX.Element {
  const { setPreferredMethod } = useLoginContext();
  const [isPending, setIsPending] = useState(false);

  const handleLogin = (): void => {
    setPreferredMethod(google);
    setIsPending(true);
    void signIn(google);
  };

  return (
    <Button
      type="button"
      variant="secondary"
      disabled={isPending}
      aria-busy={isPending}
      onClick={handleLogin}
    >
      {isPending && <Spinner />}
      <Google />
      使用 Google 帐号继续
    </Button>
  );
}

"use client";

import { signIn } from "next-auth/react";
import type { JSX } from "react";
import { useState } from "react";
import { Github } from "@/shared/assets/icons";
import { AUTH_REDIRECT_HOME } from "@/shared/lib/auth/constants";
import { Button } from "@/shared/ui/button";
import { Spinner } from "@/shared/ui/spinner";
import { github, useLoginContext } from "../model/login-context";

// 渲染 GitHub 第三方登录入口并记录用户偏好。
export function LoginGithub(): JSX.Element {
  const { preferredMethod, setPreferredMethod } = useLoginContext();
  const [isPending, setIsPending] = useState(false);

  const handleLogin = (): void => {
    setPreferredMethod(github);
    setIsPending(true);
    void signIn(github, { callbackUrl: AUTH_REDIRECT_HOME });
  };

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        variant="secondary"
        disabled={isPending}
        aria-busy={isPending}
        onClick={handleLogin}
      >
        {isPending && <Spinner />}
        <Github />
        使用 GitHub 帐号继续
      </Button>
      {preferredMethod === github && (
        <p className="text-center font-medium text-muted-foreground text-xs">
          你上次使用 GitHub 登录的
        </p>
      )}
    </div>
  );
}

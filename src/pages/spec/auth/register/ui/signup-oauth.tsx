"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { Github, Google } from "@/shared/assets/icons";
import {
  AUTH_PROVIDER_GITHUB,
  AUTH_PROVIDER_GOOGLE,
  AUTH_REDIRECT_HOME,
  type AuthProvider,
} from "@/shared/lib/auth/constants";
import { Button } from "@/shared/ui/button";
import { Spinner } from "@/shared/ui/spinner";

// 渲染第三方 OAuth 注册入口
export const SignUpOAuth = ({ methods }: { methods: AuthProvider[] }) => {
  const [clickedProvider, setClickedProvider] = useState<AuthProvider | null>(null);

  const handleClick = (provider: AuthProvider): void => {
    setClickedProvider(provider);
    void signIn(provider, { callbackUrl: AUTH_REDIRECT_HOME });
  };

  return (
    <>
      {methods.includes(AUTH_PROVIDER_GOOGLE) && (
        <Button variant="secondary" onClick={() => handleClick(AUTH_PROVIDER_GOOGLE)}>
          {clickedProvider === AUTH_PROVIDER_GOOGLE && <Spinner />}
          <Google />
          使用 Google 帐号继续
        </Button>
      )}
      {methods.includes(AUTH_PROVIDER_GITHUB) && (
        <Button variant="secondary" onClick={() => handleClick(AUTH_PROVIDER_GITHUB)}>
          {clickedProvider === AUTH_PROVIDER_GITHUB && <Spinner />}
          <Github />
          使用 GitHub 帐号继续
        </Button>
      )}
    </>
  );
};

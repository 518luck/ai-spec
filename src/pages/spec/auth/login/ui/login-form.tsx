"use client";

import { AnimatedSizeContainer } from "@/shared/ui/animated-size-container";
import { AuthMethodsSeparator } from "@/shared/ui/auth-methods-separator";
import { ClientOnly } from "@/shared/ui/client-only";
import type { JSX } from "react";
import {
  email,
  github,
  google,
  type LoginMethod,
  LoginProvider,
  useLoginContext,
} from "../model/login-context";
import { LoginEmail } from "./login-email";
import { LoginGithub } from "./login-github";
import { LoginGoogle } from "./login-google";

type OauthLoginMethod = typeof google | typeof github;

type LoginFormProps = {
  methods?: readonly LoginMethod[];
};

const defaultLoginMethods = [email, google, github] as const;
const oauthLoginMethods = [google, github] as const;

// 根据用户偏好调整第三方登录按钮的显示顺序。
const getOrderedOauthMethods = (
  methods: readonly LoginMethod[],
  preferredMethod: LoginMethod | null,
): OauthLoginMethod[] => {
  const availableMethods = oauthLoginMethods.filter((method) =>
    methods.includes(method),
  );
  const preferredOauthMethod = availableMethods.find(
    (method) => method === preferredMethod,
  );

  if (!preferredOauthMethod) {
    return availableMethods;
  }

  return [
    preferredOauthMethod,
    ...availableMethods.filter((method) => method !== preferredMethod),
  ];
};

// 渲染单个第三方登录方式组件。
const renderOauthMethod = (method: OauthLoginMethod): JSX.Element => {
  if (method === google) {
    return <LoginGoogle key={method} />;
  }

  return <LoginGithub key={method} />;
};

// 提供登录页状态并渲染登录表单。
export function LoginForm({
  methods = defaultLoginMethods,
}: LoginFormProps): JSX.Element {
  return (
    <ClientOnly>
      <LoginProvider>
        <LoginFormContent methods={methods} />
      </LoginProvider>
    </ClientOnly>
  );
}

// 按上次登录方式组织邮箱登录与第三方登录顺序。
function LoginFormContent({ methods }: Required<LoginFormProps>): JSX.Element {
  const { preferredMethod } = useLoginContext();
  const supportsEmail = methods.includes(email);
  const oauthMethods = getOrderedOauthMethods(methods, preferredMethod);
  const shouldShowEmailFirst =
    preferredMethod === null ||
    preferredMethod === email ||
    !oauthMethods.some((method) => method === preferredMethod);

  return (
    <AnimatedSizeContainer height>
      <div className="flex flex-col gap-3 p-1">
        {shouldShowEmailFirst ? (
          <>
            {supportsEmail && <LoginEmail />}
            {supportsEmail && oauthMethods.length > 0 && (
              <AuthMethodsSeparator />
            )}
            {oauthMethods.map(renderOauthMethod)}
          </>
        ) : (
          <>
            {oauthMethods.map(renderOauthMethod)}
            {supportsEmail && oauthMethods.length > 0 && (
              <AuthMethodsSeparator />
            )}
            {supportsEmail && <LoginEmail />}
          </>
        )}
      </div>
    </AnimatedSizeContainer>
  );
}

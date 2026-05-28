"use client";

import { useLocalStorage } from "@/shared/hooks/use-local-storage";
import {
  createContext,
  type JSX,
  type PropsWithChildren,
  useContext,
  useRef,
  useState,
} from "react";

// Google 登录方式标识。
export const google = "google" as const;

// 邮箱登录方式标识。
export const email = "email" as const;

// GitHub 登录方式标识。
export const github = "github" as const;

// 密码凭据字段标识。
export const password = "password" as const;

export type LoginMethod = typeof google | typeof email | typeof github;
export type LoginCredentialField = typeof email | typeof password;

type LoginContextType = {
  email: string;
  password: string;
  showPasswordField: boolean;
  preferredMethod: LoginMethod | null;
  setEmail: (value: string) => void;
  setPassword: (value: string) => void;
  setShowPasswordField: (value: boolean) => void;
  setPreferredMethod: (method: LoginMethod) => void;
};

// localStorage 里的 key
const loginPreferredMethodStorageKey = "prompt-shelf:login-preferred-method";

const LoginContext = createContext<LoginContextType | null>(null);

// 判断本地存储中的值是否为受支持的登录方式。
const isLoginMethod = (value: string | null): value is LoginMethod => {
  return value === google || value === email || value === github;
};

// 为登录页提供账号数据与用户登录习惯。
export function LoginProvider({ children }: PropsWithChildren): JSX.Element {
  const [emailValue, setEmailValue] = useState("");
  const [passwordValue, setPasswordValue] = useState("");
  const [showPasswordField, setShowPasswordField] = useState(false);
  const [storedPreferredMethod, setStoredPreferredMethod] =
    useLocalStorage<LoginMethod | null>(loginPreferredMethodStorageKey, null);
  const [preferredMethod] = useState<LoginMethod | null>(() =>
    isLoginMethod(storedPreferredMethod) ? storedPreferredMethod : null,
  );
  const preferredMethodRef = useRef<LoginMethod | null>(preferredMethod);

  const setPreferredMethod = (method: LoginMethod): void => {
    if (preferredMethodRef.current === method) {
      return;
    }

    preferredMethodRef.current = method;
    setStoredPreferredMethod(method);
  };

  return (
    <LoginContext.Provider
      value={{
        email: emailValue,
        password: passwordValue,
        showPasswordField,
        preferredMethod,
        setEmail: setEmailValue,
        setPassword: setPasswordValue,
        setShowPasswordField,
        setPreferredMethod,
      }}
    >
      {children}
    </LoginContext.Provider>
  );
}

// 读取登录页共享状态并保证调用位置正确。
export const useLoginContext = (): LoginContextType => {
  const context = useContext(LoginContext);

  if (context === null) {
    throw new Error("useLoginContext 必须在 LoginProvider 组件内部使用。");
  }

  return context;
};

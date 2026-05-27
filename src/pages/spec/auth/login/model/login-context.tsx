"use client";

import {
  createContext,
  type JSX,
  type PropsWithChildren,
  useContext,
  useState,
  useSyncExternalStore,
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
  preferredMethod: LoginMethod;
  setEmail: (value: string) => void;
  setPassword: (value: string) => void;
  setShowPasswordField: (value: boolean) => void;
  setPreferredMethod: (method: LoginMethod) => void;
};

const loginPreferredMethodStorageKey = "prompt-shelf:login-preferred-method";
const loginPreferredMethodChangeEvent = "login-preferred-method-change";

const LoginContext = createContext<LoginContextType | null>(null);

// 判断本地存储中的值是否为受支持的登录方式。
const isLoginMethod = (value: string | null): value is LoginMethod => {
  return value === google || value === email || value === github;
};

// 从浏览器本地存储读取用户上次使用的登录方式。
const getStoredPreferredMethod = (): LoginMethod => {
  if (typeof window === "undefined") {
    return email;
  }

  const storedMethod = window.localStorage.getItem(
    loginPreferredMethodStorageKey,
  );

  return isLoginMethod(storedMethod) ? storedMethod : email;
};

// 服务端渲染时使用默认邮箱登录方式，避免读取浏览器 API。
const getServerPreferredMethod = (): LoginMethod => email;

// 订阅本地登录偏好变化，让当前页面和其它标签页保持同步。
const subscribeToPreferredMethod = (
  onStoreChange: () => void,
): (() => void) => {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener("storage", onStoreChange);
  window.addEventListener(loginPreferredMethodChangeEvent, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(loginPreferredMethodChangeEvent, onStoreChange);
  };
};

// 为登录页提供账号数据与用户登录习惯。
export function LoginProvider({ children }: PropsWithChildren): JSX.Element {
  const [emailValue, setEmailValue] = useState("");
  const [passwordValue, setPasswordValue] = useState("");
  const [showPasswordField, setShowPasswordField] = useState(false);
  const preferredMethod = useSyncExternalStore(
    subscribeToPreferredMethod,
    getStoredPreferredMethod,
    getServerPreferredMethod,
  );

  const setPreferredMethod = (method: LoginMethod): void => {
    window.localStorage.setItem(loginPreferredMethodStorageKey, method);
    window.dispatchEvent(new Event(loginPreferredMethodChangeEvent));
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

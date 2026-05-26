import { createContext, useContext, useEffect, useState } from "react";
import type { Dispatch, ReactNode, SetStateAction } from "react";

export const authMethods = [
  "google",
  "github",
  "email",
  "saml",
  "password",
] as const;
export type AuthMethod = (typeof authMethods)[number];

const lastUsedAuthMethodStorageKey = "last-used-auth-method";
const authMethodSet = new Set<string>(authMethods);

const isAuthMethod = (value: string | null): value is AuthMethod =>
  value !== null && authMethodSet.has(value);

export type LoginContextType = {
  authMethod: AuthMethod | undefined;
  setAuthMethod: Dispatch<SetStateAction<AuthMethod | undefined>>;
  clickedMethod: AuthMethod | undefined;
  showPasswordField: boolean;
  setShowPasswordField: Dispatch<SetStateAction<boolean>>;
  setClickedMethod: Dispatch<SetStateAction<AuthMethod | undefined>>;
  setLastUsedAuthMethod: Dispatch<SetStateAction<AuthMethod | undefined>>;
};

export const LoginFormContext = createContext<LoginContextType | null>(null);

export function LoginFormProvider({ children }: { children: ReactNode }) {
  const [authMethod, setAuthMethod] = useState<AuthMethod | undefined>();
  const [clickedMethod, setClickedMethod] = useState<AuthMethod | undefined>();
  const [showPasswordField, setShowPasswordField] = useState(false);
  const [lastUsedAuthMethod, setLastUsedAuthMethod] = useState<
    AuthMethod | undefined
  >(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const storedAuthMethod = window.localStorage.getItem(
      lastUsedAuthMethodStorageKey,
    );

    return isAuthMethod(storedAuthMethod) ? storedAuthMethod : undefined;
  });

  useEffect(() => {
    if (lastUsedAuthMethod === undefined) {
      window.localStorage.removeItem(lastUsedAuthMethodStorageKey);
      return;
    }

    window.localStorage.setItem(
      lastUsedAuthMethodStorageKey,
      lastUsedAuthMethod,
    );
  }, [lastUsedAuthMethod]);

  return (
    <LoginFormContext.Provider
      value={{
        authMethod,
        setAuthMethod,
        clickedMethod,
        showPasswordField,
        setShowPasswordField,
        setClickedMethod,
        setLastUsedAuthMethod,
      }}
    >
      {children}
    </LoginFormContext.Provider>
  );
}

export function useLoginContext() {
  const ctx = useContext(LoginFormContext);

  if (!ctx) {
    throw new Error("useLoginContext 必须在 LoginFormProvider 内部使用");
  }

  return ctx;
}

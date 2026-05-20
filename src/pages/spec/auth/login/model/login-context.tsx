import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useContext,
  useState,
} from "react";

export const authMethods = [
  "google",
  "github",
  "email",
  "saml",
  "password",
] as const;
export type AuthMethod = (typeof authMethods)[number];

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
  >();

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

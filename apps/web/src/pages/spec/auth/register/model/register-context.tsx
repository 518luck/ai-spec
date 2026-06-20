"use client";

import {
  createContext,
  type PropsWithChildren,
  useContext,
  useState,
} from "react";

type RegisterContextType = {
  email: string;
  password: string;
  step: "signup" | "verify";
  setEmail: (email: string) => void;
  setPassword: (password: string) => void;
  setStep: (step: "signup" | "verify") => void;
};

const RegisterContext = createContext<RegisterContextType | null>(null);

export const RegisterProvider: React.FC<
  PropsWithChildren<{ email?: string }>
> = ({ email: emailProp, children }) => {
  const [email, setEmail] = useState<string>(emailProp ?? "");
  const [password, setPassword] = useState<string>("");
  const [step, setStep] = useState<"signup" | "verify">("signup");

  return (
    <RegisterContext.Provider
      value={{
        email,
        password,
        step,
        setEmail,
        setPassword,
        setStep,
      }}
    >
      {children}
    </RegisterContext.Provider>
  );
};

export const useRegisterContext = () => {
  const context = useContext(RegisterContext);

  if (context === null) {
    throw new Error(
      "useRegisterContext 必须在 RegisterProvider 组件内部使用。",
    );
  }

  return context;
};

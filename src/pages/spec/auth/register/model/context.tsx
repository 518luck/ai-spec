"use client";

import {
	createContext,
	type PropsWithChildren,
	useContext as useReactContext,
	useState,
} from "react";

type ContextType = {
	email: string;
	password: string;
	step: "signup" | "verify";
	setEmail: (email: string) => void;
	setPassword: (password: string) => void;
	setStep: (step: "signup" | "verify") => void;
};

const Context = createContext<ContextType | null>(null);

// # 注册流程共享状态：邮箱/密码及 signup→verify 步骤切换
export const Provider: React.FC<PropsWithChildren<{ email?: string }>> = ({
	email: emailProp,
	children,
}) => {
	const [email, setEmail] = useState<string>(emailProp ?? "");
	const [password, setPassword] = useState<string>("");
	const [step, setStep] = useState<"signup" | "verify">("signup");

	return (
		<Context.Provider
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
		</Context.Provider>
	);
};

// ! 必须在 Provider 内部调用，否则抛错
export const useContext = () => {
	const context = useReactContext(Context);

	if (context === null) {
		throw new Error("useContext 必须在 Provider 组件内部使用。");
	}

	return context;
};

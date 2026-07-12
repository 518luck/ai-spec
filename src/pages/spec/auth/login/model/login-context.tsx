"use client";

import {
	createContext,
	type JSX,
	type PropsWithChildren,
	useContext,
	useRef,
	useState,
} from "react";
import { useLocalStorage } from "@/shared/hooks";
import {
	AUTH_PROVIDER_EMAIL,
	AUTH_PROVIDER_GITHUB,
	AUTH_PROVIDER_GOOGLE,
	type AuthProvider,
} from "@/shared/lib/auth/constants";

// 登录方式重新导出，保持当前 slice 内引用简洁
export const google = AUTH_PROVIDER_GOOGLE;
export const email = AUTH_PROVIDER_EMAIL;
export const github = AUTH_PROVIDER_GITHUB;

export type LoginMethod = AuthProvider;

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

// # 为登录页提供账号数据与用户登录习惯。
export function LoginProvider({ children }: PropsWithChildren): JSX.Element {
	const [emailValue, setEmailValue] = useState("");
	const [passwordValue, setPasswordValue] = useState("");
	const [showPasswordField, setShowPasswordField] = useState(false);
	// react-use 的 useLocalStorage 返回 T | undefined（用户清空 localStorage 时），解构默认值兜底回 null
	const [storedPreferredMethod = null, setStoredPreferredMethod] =
		useLocalStorage<LoginMethod | null>(loginPreferredMethodStorageKey);
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

// ! 必须在 LoginProvider 内部调用，否则抛错
export const useLoginContext = (): LoginContextType => {
	const context = useContext(LoginContext);

	if (context === null) {
		throw new Error("useLoginContext 必须在 LoginProvider 组件内部使用。");
	}

	return context;
};

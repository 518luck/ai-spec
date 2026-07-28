"use client";

import {
	createContext,
	type JSX,
	type PropsWithChildren,
	useContext as useReactContext,
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

export type Method = AuthProvider;

type ContextType = {
	email: string;
	password: string;
	showPasswordField: boolean;
	preferredMethod: Method | null;
	setEmail: (value: string) => void;
	setPassword: (value: string) => void;
	setShowPasswordField: (value: boolean) => void;
	setPreferredMethod: (method: Method) => void;
};

// localStorage 里的 key
const loginPreferredMethodStorageKey = "prompt-shelf:login-preferred-method";

const Context = createContext<ContextType | null>(null);

// 判断本地存储中的值是否为受支持的登录方式。
const isMethod = (value: string | null): value is Method => {
	return value === google || value === email || value === github;
};

// # 为登录页提供账号数据与用户登录习惯。
export function Provider({ children }: PropsWithChildren): JSX.Element {
	const [emailValue, setEmailValue] = useState("");
	const [passwordValue, setPasswordValue] = useState("");
	const [showPasswordField, setShowPasswordField] = useState(false);
	// localStorage 持久化用户偏好的登录方式（null = 未记录偏好）
	const [storedPreferredMethod, setStoredPreferredMethod] = useLocalStorage<Method | null>(
		loginPreferredMethodStorageKey,
		null,
	);
	const [preferredMethod] = useState<Method | null>(() =>
		isMethod(storedPreferredMethod) ? storedPreferredMethod : null,
	);
	const preferredMethodRef = useRef<Method | null>(preferredMethod);

	const setPreferredMethod = (method: Method): void => {
		if (preferredMethodRef.current === method) {
			return;
		}

		preferredMethodRef.current = method;
		setStoredPreferredMethod(method);
	};

	return (
		<Context.Provider
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
		</Context.Provider>
	);
}

// ! 必须在 Provider 内部调用，否则抛错
export const useContext = (): ContextType => {
	const context = useReactContext(Context);

	if (context === null) {
		throw new Error("useContext 必须在 Provider 组件内部使用。");
	}

	return context;
};

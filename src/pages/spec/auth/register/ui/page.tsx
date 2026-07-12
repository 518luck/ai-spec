import { AuthFormLayout } from "@/widgets/auth-form-layout";
import RegisterPageClient from "./page-client";

// # 注册页面：包裹布局并挂载客户端流程
export default function RegisterPage() {
	return (
		<AuthFormLayout>
			<RegisterPageClient />
		</AuthFormLayout>
	);
}

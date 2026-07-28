import type { JSX } from "react";
import { Suspense } from "react";
import { ScaleLoaderWrap } from "@/shared/ui/scale-loader";
import { AuthFormLayout } from "@/widgets/auth-form-layout";
import { Flow } from "./flow";

type PageProps = {
	token: string;
	isCancel: boolean;
};

// # 渲染邮箱变更确认页：Suspense 包裹异步服务端流程，等待期间显示 loading
export function Page({ token, isCancel }: PageProps): JSX.Element {
	return (
		<AuthFormLayout showTerms="app">
			<Suspense
				fallback={
					<div className="flex w-full justify-center text-muted-foreground">
						<ScaleLoaderWrap height={20} width={3} margin={2} radius={2} />
					</div>
				}
			>
				<Flow token={token} isCancel={isCancel} />
			</Suspense>
		</AuthFormLayout>
	);
}

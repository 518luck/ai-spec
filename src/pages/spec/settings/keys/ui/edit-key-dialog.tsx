"use client";

import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { type JSX, useState } from "react";
import { toast } from "sonner";
import { updateTokenAction } from "@/server/actions/token/update-token";
import type { ScopePresetValue } from "@/server/rbac/scopes";
import { tokenNameSchema } from "@/shared/lib/zod/schemas/token";
import { Button } from "@/shared/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/shared/ui/dialog";
import {
	buildMatrixFromScopes,
	buildScopes,
	KeyForm,
	type PermissionMatrix,
	scopesToPreset,
} from "./key-form-fields";

// 编辑弹窗所需的最小密钥快照：id 标识更新目标，其余字段用于回填表单初值
type EditableToken = {
	id: string;
	name: string;
	description: string | null;
	scopes: string | null;
};

type EditKeyDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	token: EditableToken;
};

// 编辑 API 密钥弹窗：仅可改名称、描述、权限；密钥本身不可改，因此无明文展示视图
export function EditKeyDialog({ open, onOpenChange, token }: EditKeyDialogProps): JSX.Element {
	const router = useRouter();
	// 由 token 现有值派生表单初值：scopes 字符串拆分为数组后反推预设与勾选矩阵
	const initialScopes = token.scopes ? token.scopes.split(" ") : [];
	const initialPermission = scopesToPreset(initialScopes);
	const initialMatrix = buildMatrixFromScopes(initialScopes);

	const [name, setName] = useState(token.name);
	const [description, setDescription] = useState(token.description ?? "");
	const [permission, setPermission] = useState<ScopePresetValue>(initialPermission);
	const [matrix, setMatrix] = useState<PermissionMatrix>(initialMatrix);

	const { executeAsync, isPending } = useAction(updateTokenAction, {
		onSuccess: () => {
			toast.success("已保存");
			router.refresh();
			onOpenChange(false);
		},
		onError: ({ error }) => {
			toast.error(error.serverError || "保存失败，请稍后重试");
		},
	});

	// 弹窗开合处理：关闭时把表单重置回 token 初值，避免下次打开残留本次编辑
	const handleOpenChange = (next: boolean): void => {
		if (!next) {
			setName(token.name);
			setDescription(token.description ?? "");
			setPermission(initialPermission);
			setMatrix(initialMatrix);
		}
		onOpenChange(next);
	};

	// 提交保存：名称用与后端同一份 schema 预校验；限制权限下至少勾选一个资源
	const handleSave = (): void => {
		const parsed = tokenNameSchema.safeParse(name);
		if (!parsed.success) {
			toast.error(parsed.error.issues[0]?.message ?? "请输入密钥名称");
			return;
		}
		const scopes = buildScopes(permission, matrix);
		if (permission === "restricted" && scopes.length === 0) {
			toast.error("请至少选择一个资源");
			return;
		}
		void executeAsync({ id: token.id, name: parsed.data, description, scopes });
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent showCloseButton={false} className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="text-lg">编辑 API 密钥</DialogTitle>
					<DialogDescription className="text-sm leading-6">
						修改密钥名称、描述与权限。
					</DialogDescription>
				</DialogHeader>

				<KeyForm
					name={name}
					description={description}
					permission={permission}
					matrix={matrix}
					// 编辑弹窗本次不支持改过期时间：隐藏过期区块，相关 props 传占位值仅满足类型
					showExpiry={false}
					expiryPreset="never"
					expiryDate={undefined}
					onExpiryPresetChange={() => {}}
					onExpiryDateChange={() => {}}
					onNameChange={setName}
					onDescriptionChange={setDescription}
					onPermissionChange={setPermission}
					onMatrixChange={setMatrix}
				/>

				<DialogFooter>
					<Button
						className="w-full"
						onClick={handleSave}
						disabled={isPending}
						aria-busy={isPending}
					>
						{isPending ? "保存中..." : "保存"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

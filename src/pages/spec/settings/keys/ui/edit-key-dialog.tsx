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
import { computeExpires } from "../config/constants";
import {
	buildMatrixFromScopes,
	buildScopes,
	type ExpiryPresetValue,
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
	expires: Date | null;
};

type EditKeyDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	token: EditableToken;
};

// 由令牌的 expires 字段反推过期预设：null=永不过期，有值则统一归为 custom（编辑时无法还原当初是否为 7d/30d/90d，按具体日期展示最准确）
const deriveExpiryPreset = (expires: Date | null): ExpiryPresetValue =>
	expires ? "custom" : "never";

// 编辑 API 密钥弹窗：可改名称、描述、权限、过期时间；密钥本身不可改，因此无明文展示视图
export function EditKeyDialog({ open, onOpenChange, token }: EditKeyDialogProps): JSX.Element {
	const router = useRouter();
	// 由 token 现有值派生表单初值：scopes 字符串拆分为数组后反推预设与勾选矩阵
	const initialScopes = token.scopes ? token.scopes.split(" ") : [];
	const initialPermission = scopesToPreset(initialScopes);
	const initialMatrix = buildMatrixFromScopes(initialScopes);
	const initialExpiryPreset = deriveExpiryPreset(token.expires);

	const [name, setName] = useState(token.name);
	const [description, setDescription] = useState(token.description ?? "");
	const [permission, setPermission] = useState<ScopePresetValue>(initialPermission);
	const [matrix, setMatrix] = useState<PermissionMatrix>(initialMatrix);
	const [expiryPreset, setExpiryPreset] = useState<ExpiryPresetValue>(initialExpiryPreset);
	// 已存在的过期时间作为日期选择器初值；永不过期为 undefined
	const [expiryDate, setExpiryDate] = useState<Date | undefined>(token.expires ?? undefined);

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
			setExpiryPreset(initialExpiryPreset);
			setExpiryDate(token.expires ?? undefined);
		}
		onOpenChange(next);
	};

	// 提交保存：名称用与后端同一份 schema 预校验；限制权限下至少勾选一个资源；自定义过期必须选日期
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
		if (expiryPreset === "custom" && !expiryDate) {
			toast.error("请选择过期日期");
			return;
		}
		void executeAsync({
			id: token.id,
			name: parsed.data,
			description,
			scopes,
			expires: computeExpires(expiryPreset, expiryDate),
		});
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent showCloseButton={false} className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="text-lg">编辑 API 密钥</DialogTitle>
					<DialogDescription className="text-sm leading-6">
						修改密钥名称、描述、权限与过期时间。
					</DialogDescription>
				</DialogHeader>

				<KeyForm
					name={name}
					description={description}
					permission={permission}
					matrix={matrix}
					expiryPreset={expiryPreset}
					expiryDate={expiryDate}
					onNameChange={setName}
					onDescriptionChange={setDescription}
					onPermissionChange={setPermission}
					onMatrixChange={setMatrix}
					onExpiryPresetChange={setExpiryPreset}
					onExpiryDateChange={setExpiryDate}
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

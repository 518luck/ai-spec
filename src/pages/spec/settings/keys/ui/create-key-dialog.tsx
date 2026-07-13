"use client";

// # 创建 API 密钥弹窗
// 密钥归属于个人工作空间，支持名称、权限及限制权限下的资源勾选；创建成功后明文仅展示一次

import copy from "copy-to-clipboard";
import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { type JSX, useState } from "react";
import { toast } from "sonner";
import { createTokenAction } from "@/server/actions/token/create-token";
import type { ScopePresetValue } from "@/server/rbac/scopes";
import { tokenNameSchema } from "@/shared/lib/zod/schemas/token";
import { Button } from "@/shared/ui/button";
import {
	Dialog,
	DialogContent,
	DialogContentBody,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/shared/ui/dialog";
import { Icons } from "@/shared/ui/icons";
import { computeExpires } from "../lib/expires";
import {
	buildScopes,
	createEmptyMatrix,
	type ExpiryPresetValue,
	KeyForm,
	type PermissionMatrix,
} from "./key-form-fields";

type CreateKeyDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

// 创建 API 密钥弹窗：密钥归属于个人工作空间，支持名称、权限及限制权限下的资源勾选
export function CreateKeyDialog({ open, onOpenChange }: CreateKeyDialogProps): JSX.Element {
	const router = useRouter();
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [permission, setPermission] = useState<ScopePresetValue>("all_access");
	const [matrix, setMatrix] = useState<PermissionMatrix>(createEmptyMatrix);
	const [expiryPreset, setExpiryPreset] = useState<ExpiryPresetValue>("never");
	const [expiryDate, setExpiryDate] = useState<Date | undefined>(undefined);
	// 创建成功后返回的一次性明文密钥；存在即进入展示态
	const [createdKey, setCreatedKey] = useState<string | null>(null);

	const { executeAsync, isPending } = useAction(createTokenAction, {
		onSuccess: ({ data }) => {
			if (!data) return;
			// ! 明文密钥仅此一次返回，后端不再存储；切到展示态让用户复制保存，关闭后无法找回
			setCreatedKey(data.key);
			router.refresh();
		},
		onError: ({ error }) => {
			toast.error(error.serverError || "创建失败，请稍后重试");
		},
	});

	// 弹窗开合处理：关闭时重置表单为初始态，避免下次打开残留上次输入
	const handleOpenChange = (next: boolean): void => {
		if (!next) {
			setName("");
			setDescription("");
			setPermission("all_access");
			setMatrix(createEmptyMatrix());
			setExpiryPreset("never");
			setExpiryDate(undefined);
			setCreatedKey(null);
		}
		onOpenChange(next);
	};

	// 提交创建：名称用与后端同一份 schema 预校验；限制权限下至少勾选一个资源；自定义过期必须选日期
	const handleCreate = (): void => {
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
			name: parsed.data,
			description,
			scopes,
			expires: computeExpires(expiryPreset, expiryDate),
		});
	};

	// 复制明文密钥到剪贴板（用 copy-to-clipboard 自动处理非 HTTPS / 旧浏览器的回退）
	const handleCopy = (): void => {
		if (!createdKey) return;
		copy(createdKey);
		toast.success("已复制到剪贴板");
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent showCloseButton={false} className="sm:max-w-md">
				{createdKey ? (
					<CreatedKeyView
						keyValue={createdKey}
						onCopy={handleCopy}
						onDone={() => handleOpenChange(false)}
					/>
				) : (
					<>
						<DialogHeader>
							<DialogTitle>创建 API 密钥</DialogTitle>
							<DialogDescription>
								生成一枚用于程序化接入的密钥，仅归属于你的个人工作空间，创建后请妥善保存。
							</DialogDescription>
						</DialogHeader>

						<DialogContentBody className="pb-0">
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
						</DialogContentBody>

						<DialogFooter>
							<Button
								className="w-full"
								onClick={handleCreate}
								disabled={isPending}
								aria-busy={isPending}
							>
								{isPending ? "创建中..." : "创建"}
							</Button>
						</DialogFooter>
					</>
				)}
			</DialogContent>
		</Dialog>
	);
}

// 创建成功后的一次性密钥展示视图：含明文、复制按钮与「关闭后不可再查」警示
// ! 此视图的明文关闭后无法再次获取，强调一次性展示语义
function CreatedKeyView({
	keyValue,
	onCopy,
	onDone,
}: {
	keyValue: string;
	onCopy: () => void;
	onDone: () => void;
}): JSX.Element {
	const [visible, setVisible] = useState(false);

	return (
		<>
			<DialogHeader>
				<DialogTitle>密钥已创建</DialogTitle>
				<DialogDescription>请立即复制保存。关闭后将无法再次查看完整密钥。</DialogDescription>
			</DialogHeader>

			<div className="bg-muted px-6 pt-4 pb-0">
				<div className="flex items-center gap-2 rounded-md bg-muted p-3">
					<code className="flex-1 break-all font-mono text-sm">
						{visible ? keyValue : "•".repeat(32)}
					</code>
					<Button
						variant="ghost"
						size="icon"
						onClick={() => setVisible((v) => !v)}
						aria-label={visible ? "隐藏密钥" : "显示密钥"}
					>
						{visible ? <Icons.eyeOff className="size-4" /> : <Icons.eye className="size-4" />}
					</Button>
					<Button variant="ghost" size="icon" onClick={onCopy} aria-label="复制密钥">
						<Icons.copy className="size-4" />
					</Button>
				</div>
			</div>

			<DialogFooter>
				<Button className="w-full" onClick={onDone}>
					完成
				</Button>
			</DialogFooter>
		</>
	);
}

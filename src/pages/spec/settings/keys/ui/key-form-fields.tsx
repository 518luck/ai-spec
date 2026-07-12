"use client";

// # 密钥表单字段（创建/编辑共用）
// 名称 + 描述 + 权限 Tab + 限制权限下的资源勾选矩阵；外层容器与动画折叠均封装于此

import dayjs from "dayjs";
import type { JSX } from "react";

import { RESOURCE_KEYS, RESOURCES, type ResourceKey } from "@/server/rbac/resource-ui";
import {
	getScopesForResource,
	type Scope,
	type ScopePresetValue,
	scopePresets,
} from "@/server/rbac/scopes";
import { AnimatedSizeContainer } from "@/shared/ui/animated-size-container";
import { DatePicker } from "@/shared/ui/date-picker";
import { HelpTooltip } from "@/shared/ui/help-tooltip";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { RadioGroup, RadioGroupItem } from "@/shared/ui/radio-group";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { Textarea } from "@/shared/ui/textarea";

// @ 资源权限粒度与过期预设
// 资源权限粒度：None(无)/Read(读)/Write(读写)，单选互斥
const RESOURCE_SCOPES = [
	{ value: "", label: "None" },
	{ value: "read", label: "Read" },
	{ value: "write", label: "Write" },
] as const;

// 过期时间预设：永不过期 / 固定天数 / 自定义；custom 时展开日期选择器
const expiryPresets = [
	{ value: "never", label: "永不过期" },
	{ value: "7d", label: "7 天" },
	{ value: "30d", label: "30 天" },
	{ value: "90d", label: "90 天" },
	{ value: "custom", label: "自定义" },
] as const;

// 过期预设值类型，供弹窗层持有状态用
export type ExpiryPresetValue = (typeof expiryPresets)[number]["value"];

// 权限勾选矩阵：每个资源对应一个 scope 值（""/read/write），仅「限制」权限下使用
export type PermissionMatrix = Record<ResourceKey, string>;

// @ 权限矩阵与 scope 互转工具
// 生成全空的权限勾选矩阵，用于初始化与关闭重置
export const createEmptyMatrix = (): PermissionMatrix =>
	Object.fromEntries(RESOURCE_KEYS.map((key) => [key, ""])) as PermissionMatrix;

// > 把弹窗权限选择翻译成后端可识别的 scope 数组
export const buildScopes = (permission: ScopePresetValue, matrix: PermissionMatrix): Scope[] => {
	// 全部 / 只读直接取预设内带的通配 scope
	const presetScopes = scopePresets.find((item) => item.value === permission)?.scopes;
	if (presetScopes && presetScopes.length > 0) return [...presetScopes];

	// 限制权限：按矩阵勾选的资源 + 粒度，从权威表查回对应的 scope
	return RESOURCE_KEYS.flatMap((resource) => {
		const scopeValue = matrix[resource];
		if (scopeValue === "") return [];
		// getScopesForResource 已返回该资源的 read/write scope，按勾选粒度取对应那条
		return getScopesForResource(resource)
			.filter((item) => item.type === scopeValue)
			.map((item) => item.scope);
	});
};

// 由存储的 scope 数组反推所属预设：通配优先于资源级，编辑已有密钥时初始化高亮按钮用
export const scopesToPreset = (scopes: readonly string[]): ScopePresetValue => {
	if (scopes.includes("apis.all")) return "all_access";
	if (scopes.includes("apis.read")) return "read_only";
	return "restricted";
};

// 由存储的 scope 数组反推权限勾选矩阵：遍历每个资源，write 优先于 read，无则留空
export const buildMatrixFromScopes = (scopes: readonly string[]): PermissionMatrix => {
	const scopeSet = new Set(scopes);
	// 把键值对的数组转换为对象
	return Object.fromEntries(
		RESOURCE_KEYS.map((resource) => {
			const entries = getScopesForResource(resource);
			// write 包含 read，命中 write 即记 write，否则看是否命中 read
			const writeEntry = entries.find((item) => item.type === "write" && scopeSet.has(item.scope));
			if (writeEntry) return [resource, "write"];
			const readEntry = entries.find((item) => item.type === "read" && scopeSet.has(item.scope));
			if (readEntry) return [resource, "read"];
			return [resource, ""];
		}),
	) as PermissionMatrix;
};

type KeyFormProps = {
	name: string;
	description: string;
	permission: ScopePresetValue;
	matrix: PermissionMatrix;
	expiryPreset: ExpiryPresetValue;
	expiryDate: Date | undefined;
	// 是否渲染过期时间区块；创建弹窗传 true（默认），编辑弹窗暂不支持改过期传 false
	showExpiry?: boolean;
	onNameChange: (value: string) => void;
	onDescriptionChange: (value: string) => void;
	onPermissionChange: (value: ScopePresetValue) => void;
	onMatrixChange: (next: PermissionMatrix) => void;
	onExpiryPresetChange: (value: ExpiryPresetValue) => void;
	onExpiryDateChange: (date: Date | undefined) => void;
};

// @ 密钥表单主体组件
// 调用方无需关心 KeyFormFields / PermissionTable 的拼装，直接传受控值与回调
export function KeyForm({
	name,
	description,
	permission,
	matrix,
	expiryPreset,
	expiryDate,
	showExpiry = true,
	onNameChange,
	onDescriptionChange,
	onPermissionChange,
	onMatrixChange,
	onExpiryPresetChange,
	onExpiryDateChange,
}: KeyFormProps): JSX.Element {
	const permissionHint = scopePresets.find((item) => item.value === permission)?.description ?? "";

	// 切换某资源的权限粒度（None/Read/Write）
	const handleResourceScopeChange = (key: ResourceKey, scopeValue: string): void => {
		onMatrixChange({ ...matrix, [key]: scopeValue });
	};

	return (
		<div className="flex flex-col gap-6 bg-muted px-6 pt-4 pb-0">
			<div className="flex flex-col gap-4">
				<div className="flex flex-col gap-2">
					<Label>密钥名称</Label>
					<Input
						value={name}
						placeholder="例如：读取 Prompt、同步智能体"
						onChange={(event) => onNameChange(event.target.value)}
					/>
				</div>

				<div className="flex flex-col gap-2">
					<Label>描述（可选）</Label>
					<Textarea
						className="resize-none break-all"
						value={description}
						placeholder="例如：用于本地开发环境"
						onChange={(event) => onDescriptionChange(event.target.value)}
						rows={2}
					/>
				</div>

				{showExpiry && (
					<div className="flex flex-col gap-2">
						<Label>过期时间</Label>
						<Tabs
							value={expiryPreset}
							onValueChange={(value) => onExpiryPresetChange(value as ExpiryPresetValue)}
						>
							<TabsList className="w-full border border-border bg-transparent">
								{expiryPresets.map((item) => (
									<TabsTrigger key={item.value} value={item.value}>
										{item.label}
									</TabsTrigger>
								))}
							</TabsList>
						</Tabs>

						{/* 自定义过期时间下展开日期选择器，紧贴过期 tab 下方 */}
						<AnimatedSizeContainer
							height
							className="w-full"
							transition={{ type: "tween", duration: 0.3, ease: "easeInOut" }}
						>
							{expiryPreset === "custom" && (
								<DatePicker
									value={expiryDate}
									onChange={onExpiryDateChange}
									// 只允许选今天之后的日期，避免创建出已过期的密钥
									minDate={dayjs().add(1, "day").toDate()}
								/>
							)}
						</AnimatedSizeContainer>
					</div>
				)}

				<div className="flex flex-col gap-2">
					<Label>权限</Label>
					{/* 权限以 tab 形式选择，选中即对应权限，联动下方范围说明与资源勾选 */}
					<Tabs
						value={permission}
						onValueChange={(value) => onPermissionChange(value as ScopePresetValue)}
					>
						<TabsList className="w-full border border-border bg-transparent">
							{scopePresets.map((item) => (
								<TabsTrigger key={item.value} value={item.value}>
									{item.label}
								</TabsTrigger>
							))}
						</TabsList>
					</Tabs>
					<p className="text-muted-foreground text-sm">{permissionHint}</p>

					{/* 限制权限下展开资源勾选矩阵，紧贴权限 tab 下方 */}
					<AnimatedSizeContainer
						height
						className="w-full"
						transition={{ type: "tween", duration: 0.3, ease: "easeInOut" }}
					>
						{permission === "restricted" && (
							<div className="flex flex-col gap-2">
								{/* 滚动区域：用 ScrollArea 替代原生 overflow-y-auto，呈现自定义滚动条 */}
								<ScrollArea className="max-h-70 rounded-md">
									<div className="flex w-full flex-col divide-y">
										{RESOURCES.map((resource) => (
											<div
												key={resource.key}
												className="flex items-center justify-between px-3 py-3"
											>
												<div className="flex shrink-0 items-center gap-1.5">
													<span className="whitespace-nowrap font-medium text-sm">
														{resource.name}
													</span>
													<HelpTooltip alignWithText content={resource.description} />
												</div>
												<RadioGroup
													value={matrix[resource.key]}
													onValueChange={(scopeValue) =>
														handleResourceScopeChange(resource.key, scopeValue as string)
													}
													className="flex w-auto shrink-0 gap-3"
												>
													{RESOURCE_SCOPES.map((scope) => (
														<Label
															key={scope.value}
															className="flex cursor-pointer items-center gap-1.5 font-normal text-sm"
														>
															<RadioGroupItem value={scope.value} />
															{scope.label}
														</Label>
													))}
												</RadioGroup>
											</div>
										))}
									</div>
								</ScrollArea>
							</div>
						)}
					</AnimatedSizeContainer>
				</div>
			</div>
		</div>
	);
}

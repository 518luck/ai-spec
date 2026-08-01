"use client";

// # 文件夹筛选下拉：复用 FolderCombobox，按 project 资源类型拉取真实文件夹

import type { JSX } from "react";

import { FolderCombobox } from "@/features/folder-combobox";

type FolderFilterSelectProps = {
	value: string | null;
	onChange: (folderId: string | null) => void;
};

// > 文件夹筛选：受控 FolderCombobox，resourceType=project 拉取项目归属文件夹
export function FolderFilterSelect({ value, onChange }: FolderFilterSelectProps): JSX.Element {
	return (
		<FolderCombobox resourceType="project" value={value} onChange={onChange} className="h-8" />
	);
}

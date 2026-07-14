"use client";

// # 草稿页文件夹筛选器：读写 URL ?folderId=xxx，供服务端的 PersonalDraftsPage 渲染

import type { JSX } from "react";

import { FolderCombobox } from "@/widgets/folder-combobox";

// > 草稿页的文件夹筛选下拉，URL 驱动，选中后服务端自动重新筛选列表
export function DraftFolderFilter(): JSX.Element {
	return <FolderCombobox resourceType="promptDraft" />;
}

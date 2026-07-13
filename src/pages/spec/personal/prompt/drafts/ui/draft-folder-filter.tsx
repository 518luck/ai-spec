"use client";

// # 草稿页文件夹筛选器：客户端组件，管理 folderId state，供服务端的 PersonalDraftsPage 渲染

import { type JSX, useState } from "react";

import { FolderCombobox } from "@/widgets/folder-combobox";

// > 草稿页的文件夹筛选下拉，FolderCombobox 封装了列表拉取和创建，这里只管选中的 state
export function DraftFolderFilter(): JSX.Element {
	const [folderId, setFolderId] = useState<string | undefined>(undefined);

	return <FolderCombobox resourceType="promptDraft" value={folderId} onChange={setFolderId} />;
}

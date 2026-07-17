// # 搜索框类型：内置字段定义 + 组件 props

// @ 内置搜索字段标识：新增字段在此追加（同步 config 的 SEARCH_FIELDS）
export type SearchFieldKey = "title" | "content";

// > 单个字段的内部配置：key 唯一标识、text 给用户看、type 决定是布尔开关还是字符串值
export type SearchFieldDefinition = {
	// 字段唯一标识
	key: SearchFieldKey;
	// 弹层里显示给用户的文案
	text: string;
	// boolean = 开关型字段（title/content），string = 取值型字段（未来的 tag/folder）
	type: "boolean" | "string";
};

// 搜索框 props：外部仅控制"用户能看到哪些字段"
export type SearchInputProps = {
	// 指定显示哪些字段（从内置全集里选）；不传或空数组则不渲染筛选按钮（纯搜索框）
	filters?: SearchFieldKey[];
	// 透传给最外层容器的 className
	className?: string;
};

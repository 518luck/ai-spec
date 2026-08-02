// # 搜索框类型：内置字段定义 + 组件 props

// @ 内置搜索字段标识：新增字段在此追加（同步 config 的 SEARCH_FIELDS）
// > title 是"名字/标题"类字段的统一开关：不同页面可把它映射到各自的名称字段（如项目的 name 文件名）
//   scope 是特殊字段（type: "single"）：不是布尔开关，弹层按它渲染范围单选区
export type SearchFieldKey = "title" | "content" | "description" | "scope";

// 搜索范围标识：project=仅当前项目（默认），all=跨全部项目
export type SearchScopeKey = "project" | "all";

// > 单个范围项配置：key 唯一标识、text 给用户看；范围是单选（与字段的多选开关区分）
export type SearchScopeDefinition = {
	// 范围唯一标识
	key: SearchScopeKey;
	// 弹层里显示给用户的文案
	text: string;
};

// > 单个字段的内部配置：key 唯一标识、text 给用户看
//   type 区分渲染形态：boolean=多选开关（true=参与搜索）；single=范围单选（选项取 SEARCH_SCOPES）
export type SearchFieldDefinition = {
	// 字段唯一标识
	key: SearchFieldKey;
	// 弹层里显示给用户的文案
	text: string;
	// 开关型：true=该字段参与搜索；单选型：从内置 SEARCH_SCOPES 取选项渲染范围区
	type: "boolean" | "single";
};

// 搜索框 props：外部仅控制"用户能看到哪些字段"（含可选的特殊 scope 字段）+ 初始默认选中哪个
export type SearchInputProps = {
	// 指定显示哪些字段（从内置全集里选，可含特殊字段 "scope" 启用范围区）；不传或空数组则不渲染筛选按钮（纯搜索框）
	filters?: SearchFieldKey[];
	// 初始默认选中的布尔字段（URL 无 filter 参数时生效）；scope 由范围缺省值管理，不允许作为默认值
	defaultFilter?: Exclude<SearchFieldKey, "scope">;
	// 透传给最外层容器的 className
	className?: string;
};

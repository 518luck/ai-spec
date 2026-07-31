// # material-icons.json 的精简类型声明：只声明文件树用到的字段，索引签名让 string 键可安全查表

declare module "material-icon-theme/dist/material-icons.json" {
	const manifest: {
		folderNames: Record<string, string>;
		folder: string;
		rootFolder: string;
	};
	export default manifest;
}

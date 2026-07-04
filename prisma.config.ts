// 此文件由 Prisma 自动生成，并假定你已经安装了以下内容：
// npm install --save-dev prisma dotenv

import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
	schema: "prisma/schema", // schema 文件在哪个地方看
	migrations: {
		// Prisma migration 文件放哪个位置， 每次运行generate命令的时候，会在generate这个文件生成文件
		path: "prisma/migrations",
	},
	datasource: {
		url: process.env.DATABASE_URL,
	},
});

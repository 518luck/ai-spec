// # Better Comments 测试文件 —— 验证各层级注释高亮效果（.ts 文件才能真实生效）

// @ 区块级标题测试

// > 单元级函数说明
function testFunction(param: string): void {
	// 普通注释：这是默认的灰色注释，用于步骤级说明
	console.log(param);

	// ! 这是一个警示级注释，提醒有坑或者危险操作
	if (param === "danger") {
		throw new Error("危险输入");
	}

	// ? 这是一个疑问级注释，标记待确认的逻辑
	// ? 是否需要在这里做参数校验？
}

// @ 第二个区块

// > 另一个函数
function anotherFunction(): number {
	// 普通步骤说明
	const result = 42;

	// ! 返回值不能是负数
	return Math.abs(result);
}

// ============================================================
// 混合层级测试
// ============================================================

// @ 常量定义
const MAX_RETRY = 3; // 普通注释：最大重试次数

// @ 类型定义
type Config = {
	// > 配置项名称
	name: string;
	// > 配置项值
	value: unknown;
};

// @ 核心函数
function loadConfig(): Config {
	// 普通步骤：先读文件
	const raw = "{}";

	// ? 文件不存在时应该用默认值还是报错？
	if (!raw) {
		// ! 文件读取失败必须抛错，不能静默返回空
		throw new Error("配置文件读取失败");
	}

	return JSON.parse(raw);
}

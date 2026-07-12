// # Better Todo Tree 测试文件 —— 验证各标签高亮 + 侧边栏树聚合（.ts 文件才能真实生效）

// ============================================================
// 单标签逐个测试（每种标签单独一段，方便对比颜色）
// ============================================================

// TODO 这里需要实现用户登录逻辑
function login() {
	// TODO 添加表单校验
	// TODO 接入后端 API
	// TODO 登录成功后跳转首页
}

// FIXME 这个函数在并发场景下会丢数据
function saveData(data: unknown) {
	// FIXME 没有做并发锁，多人同时保存会覆盖
	localStorage.setItem("data", JSON.stringify(data));
}

// BUG 在 Safari 下点击事件不触发
document.getElementById("btn")?.addEventListener("click", () => {});

// BUG 列表渲染时 key 用了 index 导致拖拽错乱
const items: string[] = [];
items.map((item, index) => ({ key: index, label: item }));

// HACK 用 setTimeout 0 绕过 React 的批处理，强制拿到更新后的 state
setTimeout(() => {
	console.log("updated");
}, 0);

// XXX 这段逻辑不太对，但暂时不知道怎么改
const flag = true;
if (flag && !flag || flag) {
	// XXX 三元嵌套太深了，后面要重构
}

// NOTE 这个接口返回的数据结构在 v2 版本会变更
fetch("/api/users").then((res) => res.json());

// NOTE 构建时必须先跑 prisma:generate，否则类型报错

// ============================================================
// 综合密集测试（一段代码里混所有标签）
// ============================================================

// @ 用户服务模块

// TODO 实现用户注册
function register() {
	// FIXME 邮箱校验正则不对
	const emailRegex = /@/;
	// BUG 手机号校验漏了 +86 前缀
	// NOTE 密码加密用 bcrypt，cost factor 固定 10
	// XXX 验证码过期时间硬编码了，后面改配置
	// HACK 这里直接改了全局变量，临时方案
}

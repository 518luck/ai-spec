// # 规约测试脚本共享工具：随机数、日期生成、断言与日志

import { BASE_DATE } from "./constants";

type AssertEqualOptions = {
	actual: number;
	expected: number;
	label: string;
};

type AssertRangeOptions = {
	value: number;
	min: number;
	max: number;
	label: string;
};

type AssertTrueOptions = {
	condition: boolean;
	label: string;
};

// 闭区间 [min, max] 随机整数
export const randomInt = (min: number, max: number): number =>
	Math.floor(Math.random() * (max - min + 1)) + min;

// 按索引生成日期：基线 + 索引 × stepMinutes 分钟，避免数据时间集中
export const makeDate = (index: number, stepMinutes = 7): Date =>
	new Date(BASE_DATE.getTime() + index * stepMinutes * 60 * 1000);

// > 严格相等断言：不符则抛错让脚本以非 0 退出码结束
export const assertEqual = ({ actual, expected, label }: AssertEqualOptions): void => {
	if (actual !== expected) {
		throw new Error(`断言失败 [${label}]: 期望 ${expected}，实际 ${actual}`);
	}
	console.log(`  ✓ ${label}: ${actual}`);
};

// > 范围断言：验证值落在闭区间内（用于超长正文字符数校验）
export const assertRange = ({ value, min, max, label }: AssertRangeOptions): void => {
	if (value < min || value > max) {
		throw new Error(`断言失败 [${label}]: 期望 ${min}~${max}，实际 ${value}`);
	}
	console.log(`  ✓ ${label}: ${value}（区间 ${min}~${max}）`);
};

// > 布尔断言：条件必须为真
export const assertTrue = ({ condition, label }: AssertTrueOptions): void => {
	if (!condition) {
		throw new Error(`断言失败 [${label}]: 条件不成立`);
	}
	console.log(`  ✓ ${label}`);
};

// @ 日志封装：统一各 seed 脚本的输出格式
export const logSection = (title: string): void => {
	console.log(`\n■ ${title}`);
};

export const logOk = (msg: string): void => {
	console.log(`  ✓ ${msg}`);
};

export const logFail = (msg: string): void => {
	console.error(`  ✗ ${msg}`);
};

export const logInfo = (msg: string): void => {
	console.log(`  · ${msg}`);
};

// 生成 6 位 OTP 验证码
export function generateOTP() {
	// 生成0到999999之间的随机数
	const randomNumber = Math.floor(Math.random() * 1000000);

	// 如果有必要，请在数字前加上前导零，以确保它始终是6位数字
	return randomNumber.toString().padStart(6, "0");
}

// # 邮箱领域任务数据类型
export interface EmailChangeData {
	to: string;
	token: string;
	oldEmail: string;
	newEmail: string;
}

export interface EmailChangedNoticeData {
	to: string;
	newEmail: string;
}

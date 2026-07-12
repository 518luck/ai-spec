"use client";

// # 受控日期选择器：Popover + Calendar 组合，点击 trigger 弹出日历，选完自动关闭，支持最小可选日期

import dayjs from "dayjs";
import type { JSX } from "react";
import { zhCN } from "react-day-picker/locale";

import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Calendar } from "@/shared/ui/calendar";
import { Icons } from "@/shared/ui/icons";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";

// DatePicker 配置项：受控值、变更回调、可选的最小可选日期（禁用过去日期）
type DatePickerProps = {
	value?: Date;
	onChange: (date: Date | undefined) => void;
	minDate?: Date;
	className?: string;
};

export function DatePicker({ value, onChange, minDate, className }: DatePickerProps): JSX.Element {
	return (
		<Popover>
			<PopoverTrigger
				render={
					<Button variant="outline" className={cn("w-full justify-start", className)}>
						<Icons.calendar className="size-4 text-muted-foreground" />
						{value ? dayjs(value).format("YYYY-MM-DD") : "选择日期"}
					</Button>
				}
			/>
			<PopoverContent className="w-auto p-0" align="start">
				<Calendar
					mode="single"
					selected={value}
					onSelect={onChange}
					locale={zhCN}
					disabled={minDate ? [{ before: minDate }] : undefined}
				/>
			</PopoverContent>
		</Popover>
	);
}

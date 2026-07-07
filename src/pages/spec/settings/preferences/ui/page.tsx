import type { JSX } from "react";
import { appConfig } from "@/shared/configs/app.config";
import { Icons } from "@/shared/ui/icons";
import { TitlePageShell } from "@/widgets/page-shell";

import { ThemeModeSwitcher } from "./theme-mode-switcher";
import { ThemePreferencePreview } from "./theme-preference-preview";

// 渲染个人偏好设置页面，展示主题偏好预览样式。
export function PreferencesPage(): JSX.Element {
	return (
		<TitlePageShell title="个人偏好">
			<p className="mb-6 text-sm leading-6">
				定制 {appConfig.appName}{" "}
				的外观。你可以锁定单一主题，也可以跟随系统自动切换日夜模式。选项即选即生效，并会自动保存。
			</p>
			<ThemeModeSwitcher />
			<div className="grid w-full grid-cols-1 gap-6 md:grid-cols-2">
				<ThemePreferencePreview
					mode="light"
					title="浅色主题"
					description="拥抱阳光，界面也要精神抖擞。"
					icon={<Icons.themeLight className="size-5" />}
				/>
				<ThemePreferencePreview
					mode="dark"
					title="深色主题"
					description="属于夜猫子的温柔暗色。"
					icon={<Icons.themeDark className="size-5" />}
				/>
			</div>
		</TitlePageShell>
	);
}

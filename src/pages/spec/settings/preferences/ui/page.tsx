import { HeaderedPageShell } from "@/widgets/page-shell";
import type { JSX } from "react";

import { ThemePreferencePreview } from "./theme-preference-preview";

// 渲染个人偏好设置页面，展示主题偏好预览样式。
export function PreferencesPage(): JSX.Element {
  return (
    <HeaderedPageShell title="个人偏好">
      <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-2">
        <ThemePreferencePreview
          title="浅色主题"
          description="拥抱阳光，界面也要精神抖擞。"
        />
        <ThemePreferencePreview
          title="深色主题"
          description="属于夜猫子的温柔暗色。"
        />
      </div>
    </HeaderedPageShell>
  );
}

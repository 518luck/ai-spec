import { HeaderedPageShell } from "@/widgets/page-shell";
import type { JSX } from "react";

import { ThemePreferencePreview } from "./theme-preference-preview";

// 渲染个人偏好设置页面，展示主题偏好预览样式。
export function PreferencesPage(): JSX.Element {
  return (
    <HeaderedPageShell title="个人偏好">
      <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-2">
        <ThemePreferencePreview />
        <ThemePreferencePreview />
      </div>
    </HeaderedPageShell>
  );
}

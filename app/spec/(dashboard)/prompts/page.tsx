"use client";

import { Button } from "@/shared/ui/button";
import { useTheme } from "next-themes";
import { useState } from "react";

export default function Page() {
  const [number, setNumber] = useState(0);
  // 这里只读取主题并用于切换，避免把不稳定的主题值直接渲染到首屏 HTML。
  const { theme, setTheme } = useTheme();

  return (
    <div>
      this is prompts page
      <Button onClick={() => setNumber(number + 1)}>button{number}</Button>
      <Button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
        toggle theme
      </Button>
    </div>
  );
}

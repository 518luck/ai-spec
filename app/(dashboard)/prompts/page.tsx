"use client";

import { Button } from "@/shared/ui/button";
import { useState } from "react";
import { useTheme } from "next-themes";

export default function PromptsPage() {
  const [number, setNumber] = useState(0);
  const { theme, setTheme } = useTheme();

  return (
    <div>
      this is prompts page
      <Button onClick={() => setNumber(number + 1)}>button{number}</Button>
      <Button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
        toggle theme
      </Button>
      <div> {theme}</div>
    </div>
  );
}

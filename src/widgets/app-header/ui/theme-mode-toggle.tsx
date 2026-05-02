import { Button } from "@/shared/ui/button";
import { Icons } from "@/shared/ui/icons";
import { Kbd } from "@/shared/ui/kbd";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";
import { useTheme } from "next-themes";
import { useCallback } from "react";

export const ThemeModeToggle = () => {
  const { setTheme, resolvedTheme } = useTheme();

  const handleThemeToggle = useCallback(
    (e?: React.MouseEvent) => {
      const newMode = resolvedTheme === "dark" ? "light" : "dark";
      const root = document.documentElement;

      if (!document.startViewTransition) {
        setTheme(newMode);
        return;
      }

      if (e) {
        root.style.setProperty("--x", `${e.clientX}px`);
        root.style.setProperty("--y", `${e.clientY}px`);
      }

      document.startViewTransition(() => {
        setTheme(newMode);
      });
    },
    [resolvedTheme, setTheme],
  );

  const trigger = (
    <Button
      variant="secondary"
      size={"icon"}
      onClick={handleThemeToggle}
      className="select-none"
    >
      <Icons.brightness />
    </Button>
  );

  return (
    <Tooltip>
      <TooltipTrigger render={trigger} />
      <TooltipContent>
        主题切换 <Kbd>T</Kbd>
      </TooltipContent>
    </Tooltip>
  );
};

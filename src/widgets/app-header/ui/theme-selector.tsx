import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Icons } from "@/shared/ui/icons";
import { Kbd } from "@/shared/ui/kbd";
import { useActiveTheme } from "@/shared/providers/active-theme-providers";
import { THEMES } from "@/shared/configs/theme.config";

export function ThemeSelector() {
  const { activeTheme, setActiveTheme } = useActiveTheme();

  return (
    <Select
      value={activeTheme}
      onValueChange={(value) => {
        if (value) setActiveTheme(String(value));
      }}
    >
      <SelectTrigger className="w-[180px]">
        <span className="text-muted-foreground hidden sm:block">
          <span className="text-muted-foreground block sm:hidden">Theme</span>
          <Icons.palette />
        </span>
        <SelectValue placeholder="选择主题" />
        <Kbd>T T</Kbd>
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false}>
        <SelectGroup>
          {THEMES.length > 0 && (
            <>
              <SelectGroup>
                <SelectLabel>主题</SelectLabel>
                <SelectSeparator />
                {THEMES.map((theme) => (
                  <SelectItem key={theme.value} value={theme.value}>
                    {theme.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </>
          )}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

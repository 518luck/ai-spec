"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/shared/ui/button";
import { Separator } from "@/shared/ui/separator";
import { SidebarTrigger } from "@/shared/ui/sidebar";
import { Kbd } from "@/shared/ui/kbd";

export default function AppHeader() {
  const router = useRouter();

  return (
    <header className="bg-background/60 m-2 flex h-14 justify-between gap-2">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator className="h-6 data-vertical:self-center" />
        <div>面包屑导航</div>
      </div>

      <div className="flex items-center gap-2">
        <div>github图标</div>
        <div className="flex items-center gap-0.5">
          <Kbd>⌘ K</Kbd>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/spec/register")}
        >
          <LogOut />
          <span>登出</span>
        </Button>
      </div>
    </header>
  );
}

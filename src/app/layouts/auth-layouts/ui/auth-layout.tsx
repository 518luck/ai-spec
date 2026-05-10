import { SidePanel } from "@/widgets/auth-side-panel";
import { GalleryVerticalEnd } from "lucide-react";
import { InteractiveGridPattern } from "./Interactive-grid-pattern";
import { ParticleNameBackground } from "./particle-name-background";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative grid min-h-screen grid-cols-1 min-[900px]:grid-cols-[minmax(0,1fr)_440px] lg:grid-cols-[minmax(0,1fr)_595px]">
      <div className="relative min-w-0 overflow-hidden">
        <InteractiveGridPattern
          glowColor="rgba(89, 95, 57, 0.20)"
          borderColor="rgba(196, 197, 186, 0.1)"
        >
          <div className="flex min-h-screen flex-col gap-4 p-6 md:p-10">
            <div className="flex justify-center gap-2 md:justify-start">
              <a href="#" className="flex items-center gap-2 font-medium">
                <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
                  <GalleryVerticalEnd className="size-4" />
                </div>
                AI Spec
              </a>
            </div>
            <div className="flex flex-1 items-center justify-center">
              <ParticleNameBackground
                className="h-44 w-full max-w-md"
                text="AI SPEC"
              />

              <div className="w-full max-w-xs">{children}</div>
            </div>
          </div>
        </InteractiveGridPattern>
      </div>
      <SidePanel />
    </div>
  );
}

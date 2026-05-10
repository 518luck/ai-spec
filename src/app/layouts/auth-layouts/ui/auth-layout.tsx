import { SidePanel } from "@/widgets/auth-side-panel";
import { GalleryVerticalEnd } from "lucide-react";
import { TITLE_NAME_COLOR } from "../config/title-name-color";
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
          glowColor="rgba(122, 148, 178, 0.30)"
          borderColor="rgba(196, 197, 186, 0.1)"
        >
          <div className="flex min-h-screen flex-col">
            <div className="flex justify-center">
              <ParticleNameBackground
                className="h-44 w-full max-w-md"
                text="AI SPEC"
                glowColor={TITLE_NAME_COLOR.glowColor}
                baseHue={TITLE_NAME_COLOR.baseHue}
                hueRange={TITLE_NAME_COLOR.hueRange}
              />
            </div>
            <div className="flex flex-1 items-center justify-center">
              <div className="w-full max-w-xs">{children}</div>
            </div>
          </div>
        </InteractiveGridPattern>
      </div>
      <SidePanel />
    </div>
  );
}

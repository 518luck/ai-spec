import { SidePanel } from "@/widgets/auth-side-panel";
import { TITLE_NAME_COLOR } from "../config/title-name-color";
import { Manrope } from "next/font/google";
import { InteractiveGridPattern } from "./Interactive-grid-pattern";
import { ParticleNameBackground } from "./particle-name-background";

const source_Serif_4 = Manrope({
  weight: "400",
  display: "swap",
});

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
          <div className="relative z-10 flex min-h-screen flex-col">
            <div className="flex justify-center">
              <ParticleNameBackground
                className="h-18 w-full max-w-md"
                text="AI Spec"
                particleCount={1500}
                glowColor={TITLE_NAME_COLOR.glowColor}
                baseHue={TITLE_NAME_COLOR.baseHue}
                hueRange={TITLE_NAME_COLOR.hueRange}
                fontFamily={source_Serif_4.style.fontFamily}
                fontWeight={400}
                textVerticalAlign={0.5}
              />
            </div>
            {children}
          </div>
        </InteractiveGridPattern>
      </div>

      <SidePanel />
    </div>
  );
}

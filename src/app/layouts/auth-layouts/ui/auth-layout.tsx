import { Manrope } from "next/font/google";
import { appConfig } from "@/shared/configs/app.config";
import { SidePanel } from "@/widgets/auth-side-panel";
import { TITLE_NAME_COLOR } from "../config/title-name-color";
import { InteractiveGridPattern } from "./Interactive-grid-pattern";
import { ParticleNameBackground } from "./particle-name-background";

const source_Serif_4 = Manrope({
	weight: "400",
	display: "swap",
});

export default function AuthLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className="relative grid min-h-screen grid-cols-1 lg:grid-cols-[minmax(0,1fr)_595px] min-[900px]:grid-cols-[minmax(0,1fr)_440px]">
			<div className="relative min-w-0 overflow-hidden">
				<InteractiveGridPattern
					glowColor="rgba(122, 148, 178, 0.30)"
					borderColor="rgba(196, 197, 186, 0.1)"
				>
					<div className="relative min-h-screen">
						<div className="absolute inset-x-0 top-0 z-10 flex justify-center">
							<ParticleNameBackground
								className="h-18 w-full max-w-md"
								text={appConfig.appName}
								particleCount={230}
								glowColor={TITLE_NAME_COLOR.glowColor}
								baseHue={TITLE_NAME_COLOR.baseHue}
								hueRange={TITLE_NAME_COLOR.hueRange}
								fontFamily={source_Serif_4.style.fontFamily}
								fontWeight={400}
								textVerticalAlign={0.5}
							/>
						</div>
						<div className="flex min-h-screen flex-col">{children}</div>
					</div>
				</InteractiveGridPattern>
			</div>

			<SidePanel />
		</div>
	);
}

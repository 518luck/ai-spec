"use client";

// # 极光背景：三团高斯模糊色块各自缓慢漂移，叠出持续流动的环境光，适合铺在空白页首屏背后

import { motion } from "motion/react";
import type { JSX } from "react";

import { cn } from "@/shared/lib/utils";

type AuroraBlob = {
	className: string;
	x: number[];
	y: number[];
	duration: number;
};

// ! 三团光斑的周期取互质的秒数：时长一旦成整数倍，几团就会周期性对上拍，循环接缝立刻看得出来
const BLOBS: AuroraBlob[] = [
	{
		className: "-left-8 -top-8 size-52 bg-primary/40",
		x: [0, 70, 20, 0],
		y: [0, 40, 80, 0],
		duration: 13,
	},
	{
		className: "-top-4 -right-6 size-48 bg-chart-2/40",
		x: [0, -60, -10, 0],
		y: [0, 50, 10, 0],
		duration: 17,
	},
	{
		className: "-bottom-12 left-1/3 size-56 bg-foreground/15",
		x: [0, 40, -50, 0],
		y: [0, -30, -60, 0],
		duration: 19,
	},
];

export function DemoAurora(): JSX.Element {
	return (
		<div className="relative h-44 w-full overflow-hidden rounded-xl border border-border bg-background">
			{BLOBS.map((blob) => (
				<motion.div
					key={blob.className}
					className={cn("absolute rounded-full blur-3xl", blob.className)}
					animate={{ x: blob.x, y: blob.y }}
					transition={{
						duration: blob.duration,
						ease: "easeInOut",
						repeat: Number.POSITIVE_INFINITY,
					}}
				/>
			))}

			<div className="relative grid h-full place-items-center">
				<p className="font-medium text-lg tracking-tight">空白页的环境光</p>
			</div>
		</div>
	);
}

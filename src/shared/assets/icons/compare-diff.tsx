// # 版本对比图标：基于 tabler arrows-left-right 改造，active 时上下箭头分别着 diff 红/绿色

import type { SVGProps } from "react";

type CompareDiffIconProps = SVGProps<SVGSVGElement> & { active?: boolean };

// active 时上箭头绿（新增）、下箭头红（删除）；否则统一 currentColor
// 选中等饱和度色值，亮/暗模式下都清晰
export function CompareDiffIcon({ active = false, className, ...props }: CompareDiffIconProps) {
	const topArrow = active ? "#16a34a" : "currentColor";
	const bottomArrow = active ? "#dc2626" : "currentColor";
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
			className={className}
			{...props}
		>
			{/* 上箭头（向左）：active 时绿色 */}
			<path d="M21 7l-18 0" stroke={topArrow} />
			<path d="M6 10l-3 -3l3 -3" stroke={topArrow} />
			{/* 下箭头（向右）：active 时红色 */}
			<path d="M3 17l18 0" stroke={bottomArrow} />
			<path d="M18 20l3 -3l-3 -3" stroke={bottomArrow} />
		</svg>
	);
}

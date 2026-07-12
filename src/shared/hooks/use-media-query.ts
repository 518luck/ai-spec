import { useEffect, useState } from "react";

// 判断当前设备尺寸属于 desktop、tablet 还是 mobile；非浏览器环境返回 null
function getDevice(): "mobile" | "tablet" | "desktop" | null {
	// window 是浏览器全局对象，SSR 时不存在
	if (typeof window === "undefined") return null;

	return window.matchMedia("(min-width: 1024px)").matches
		? "desktop"
		: window.matchMedia("(min-width: 640px)").matches
			? "tablet"
			: "mobile";
}

// 返回一个对象，包含当前浏览器窗口的宽和高
function getDimensions() {
	if (typeof window === "undefined") return null;

	return { width: window.innerWidth, height: window.innerHeight };
}

// > 获取当前设备类型和窗口尺寸，并在窗口大小变化时自动更新
export function useMediaQuery() {
	const [device, setDevice] = useState<"mobile" | "tablet" | "desktop" | null>(getDevice());
	const [dimensions, setDimensions] = useState<{
		width: number;
		height: number;
	} | null>(getDimensions());

	useEffect(() => {
		const checkDevice = () => {
			setDevice(getDevice());
			setDimensions(getDimensions());
		};

		// Initial detection
		checkDevice();

		// Listener for windows resize
		window.addEventListener("resize", checkDevice);

		// Cleanup listener
		return () => {
			window.removeEventListener("resize", checkDevice);
		};
	}, []);

	return {
		device: device, //当前设备类型，比如 "mobile" / "tablet" / "desktop"
		width: dimensions?.width, //当前宽度
		height: dimensions?.height, //当前高度
		isMobile: device === "mobile", //当前是不是手机，结果是 true/false
		isTablet: device === "tablet", //当前是不是平板，结果是 true/false
		isDesktop: device === "desktop", //当前是不是桌面，结果是 true/false
	};
}

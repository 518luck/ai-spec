import { motion } from "motion/react";
import {
	type ComponentPropsWithoutRef, // 提取某个组件/元素的 props 类型，但不包含 ref；这里用来继承 motion.div 的属性类型。
	type ForwardRefExoticComponent, // React.forwardRef 返回的组件类型；这里用来给 AnimatedSizeContainer 标注完整组件类型。
	forwardRef, // 创建可以接收外部 ref 的组件，并把 ref 转发到内部 DOM/motion 元素上。
	type PropsWithChildren, // 给 props 类型自动加上 children 属性。
	type RefAttributes, // 给组件类型补充 ref 属性类型；这里表示外部 ref 指向 HTMLDivElement。
	useRef, // 创建跨渲染保持不变的引用；这里用于保存 DOM 节点和是否已完成首次测量。
} from "react";
import { useResizeObserver } from "../hooks/use-resize-observer";
import { cn } from "../lib/utils";

// 默认动画配置
const defaultTransition = { type: "spring" as const, duration: 0.3 };

type AnimatedSizeContainerProps = PropsWithChildren<{
	width?: boolean;
	height?: boolean;
}> &
	Omit<ComponentPropsWithoutRef<typeof motion.div>, "animate" | "children">;

// forwardRef 的基础语法是：

// import { forwardRef } from "react";

// const MyComponent = forwardRef<RefType, PropsType>((props, ref) => {
//   return (
//     <div ref={ref}>
//       ...
//     </div>
//   );
// });

// 两个泛型：

// forwardRef<RefType, PropsType>

// 含义是：

// RefType   ref 最终指向什么
// PropsType 组件接收什么 props

// 根据子元素尺寸变化，按需动画过渡容器的宽度和高度。
const AnimatedSizeContainer: ForwardRefExoticComponent<
	AnimatedSizeContainerProps & RefAttributes<HTMLDivElement>
	// forwardRef 是为了让函数组件支持标准的 ref 写法，并且明确把这个 ref 转发到组件内部某个真实DOM 或子组件上。
> = forwardRef<HTMLDivElement, AnimatedSizeContainerProps>(
	(
		{
			width = false, // 是否对「宽度」做动画过渡。true 时外层容器会随内容宽度变化而平滑伸缩；false 时宽度跟随父容器（auto）。
			height = false, // 是否对「高度」做动画过渡。true 时外层容器会随内容高度变化而平滑伸缩；false 时高度自适应（auto）。
			className, // 外部传入的额外样式类名，会拼接到内层 motion.div 上（与默认的 overflow-hidden 合并）。
			transition, // 自定义动画过渡参数（如 duration、ease、type）。不传时走组件内部的默认逻辑：首次测量不动画，之后用 spring 弹簧动画。
			children, // 容器包裹的子内容；内层 div 会按 children 的真实尺寸「撑开」，供 ResizeObserver 测量。
			...rest // 剩余的其它 props（透传给 motion.div），比如 initial、style、onClick、id 等，保证组件能像普通 div 一样被使用。
		}: AnimatedSizeContainerProps,
		forwardedRef,
	) => {
		// DOM ref
		const containerRef = useRef<HTMLDivElement>(null);
		// 监听内部内容尺寸，外层容器用这个尺寸做动画。
		const resizeObserverEntry = useResizeObserver(containerRef);
		const hasMeasuredRef = useRef(false);

		const measuredWidth = resizeObserverEntry?.contentRect?.width;
		const measuredHeight = resizeObserverEntry?.contentRect?.height;

		// 这个组件是否已经完成过第一次尺寸测量？
		const isFirstMeasurement =
			(width ? measuredWidth != null : true) &&
			(height ? measuredHeight != null : true) &&
			!hasMeasuredRef.current;

		if (resizeObserverEntry) {
			hasMeasuredRef.current = true;
		}

		// 首次测量不做动画，避免组件挂载时从 0 抖到目标尺寸。
		const effectiveTransition =
			transition ?? (isFirstMeasurement ? { duration: 0 } : defaultTransition);

		return (
			<motion.div
				// 把外部传进来的 ref 挂到真正负责动画的外层容器上。
				ref={forwardedRef}
				// overflow-hidden 用来隐藏尺寸动画过程中溢出的内容。
				className={cn("overflow-hidden", className)}
				// 根据开启的 width/height 选项，把外层容器动画到测量出的内容尺寸。
				// measuredWidth 和 measuredHeight 是通过 useResizeObserver(containerRef) 测出来的子内容真实尺寸。
				animate={{
					...(width && { width: measuredWidth ?? "auto" }),
					...(height && { height: measuredHeight ?? "auto" }),
				}}
				// 控制尺寸变化的动画方式；首次测量会禁用动画。
				transition={effectiveTransition}
				// 透传其它 motion.div 支持的属性，比如 initial、style、onClick。
				{...rest}
			>
				<div ref={containerRef} className={cn(height && "h-max", width && "w-max")}>
					{children}
				</div>
			</motion.div>
		);
	},
);

AnimatedSizeContainer.displayName = "AnimatedSizeContainer";

export { AnimatedSizeContainer };

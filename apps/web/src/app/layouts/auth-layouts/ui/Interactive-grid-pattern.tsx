"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/shared/lib/utils";

export interface InteractiveGridPatternProps {
  className?: string;
  children?: React.ReactNode;
  // 每个网格单元的基础尺寸，单位为像素
  cellSize?: number;
  // 鼠标悬停时的发光颜色
  glowColor?: string;
  // 网格边框颜色
  borderColor?: string;
  // 鼠标接近时触发轻微高亮的影响半径
  proximity?: number;
}

export function InteractiveGridPattern({
  className,
  children, // 叠在网格背景上的内容层
  cellSize = 50, // 每个网格格子的默认尺寸
  glowColor = "rgba(34, 211, 238, 0.4)", // 发光主色
  borderColor = "rgba(63, 63, 70, 0.4)", // 网格线颜色
  proximity = 100, // 鼠标接近时的影响范围
}: InteractiveGridPatternProps) {
  // 容器引用，用来读取实际尺寸和鼠标相对位置
  const containerRef = useRef<HTMLDivElement>(null);
  // 当前网格需要渲染的行列数，以及根据容器尺寸计算出的缩放比例
  const [grid, setGrid] = useState({ rows: 0, cols: 0, scale: 1 });
  // 当前鼠标直接悬停到的格子索引
  const [hoveredCell, setHoveredCell] = useState<number | null>(null);
  // 鼠标在容器内部的坐标，初始化放到屏幕外避免默认触发高亮
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 });

  const updateGrid = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    // 读取容器的实际宽高，用来动态计算网格数量
    const { width, height } = container.getBoundingClientRect();
    // 根据容器尺寸放大或保持网格尺寸，避免大屏上格子显得过小
    const scale = Math.max(1, Math.min(width, height) / 800);
    const scaledCellSize = cellSize * scale;

    // 多补一行一列，避免边缘出现空白缝隙
    const cols = Math.ceil(width / scaledCellSize) + 1;
    const rows = Math.ceil(height / scaledCellSize) + 1;

    setGrid({ rows, cols, scale });
  }, [cellSize]);

  useEffect(() => {
    // 初次挂载时先计算一次网格布局
    updateGrid();
    const container = containerRef.current;
    if (!container) return;

    // 监听容器尺寸变化，保证窗口变化后网格仍然能铺满容器
    const ro = new ResizeObserver(updateGrid);
    ro.observe(container);
    return () => ro.disconnect();
  }, [updateGrid]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    // 把鼠标位置转换成相对容器左上角的坐标
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, []);

  const handleMouseLeave = useCallback(() => {
    // 鼠标离开容器后清空高亮状态
    setMousePos({ x: -1000, y: -1000 });
    setHoveredCell(null);
  }, []);

  // 结合当前缩放比例得到真实渲染尺寸
  const scaledCellSize = cellSize * grid.scale;
  // 接近高亮的影响半径也跟随缩放变化
  const scaledProximity = proximity * grid.scale;

  return (
    <div
      ref={containerRef}
      className={cn(
        "absolute inset-0 overflow-hidden bg-neutral-950",
        className,
      )}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* 网格主体层 */}
      <div className="absolute inset-0">
        {Array.from({ length: grid.rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex">
            {Array.from({ length: grid.cols }).map((_, colIndex) => {
              // 用行列号计算出当前格子的唯一索引
              // (0,0) ─────→ x增大
              //     |
              //     |
              //     ↓ y增大
              const index = rowIndex * grid.cols + colIndex;
              // 计算格子中心点，后面用来判断它离鼠标有多近
              const cellX = colIndex * scaledCellSize + scaledCellSize / 2; //当前格子中心点的 x 坐标
              const cellY = rowIndex * scaledCellSize + scaledCellSize / 2; //当前格子中心点的 y 坐标
              const dx = mousePos.x - cellX; //鼠标的 x 和格子中心 x 的差
              const dy = mousePos.y - cellY; //鼠标的 y 和格子中心 y 的差
              // 鼠标到格子中心点的直线距离
              const distance = Math.sqrt(dx * dx + dy * dy); //勾股定理求距离
              // 距离越近，数值越接近 1；超出范围后为 0
              const proximityFactor = Math.max(
                0,
                1 - distance / scaledProximity, //距离越近，值越接近 1；距离越远，值越接近 0
              );
              // 判断当前格子是否为鼠标直接悬停的格子
              const isHovered = hoveredCell === index;

              return (
                <div
                  key={index}
                  className="shrink-0 border transition-all duration-1000 ease-out"
                  style={{
                    width: scaledCellSize,
                    height: scaledCellSize,
                    borderColor: borderColor,
                    // 悬停格子使用完整发光色，附近格子根据距离衰减透明度
                    backgroundColor: isHovered
                      ? glowColor
                      : proximityFactor > 0
                        ? glowColor.replace(
                            /[\d.]+\)$/,
                            `${proximityFactor * 0.15})`,
                          )
                        : "transparent",
                    // 悬停时额外叠加外发光和内发光，增强聚焦效果
                    boxShadow: isHovered
                      ? `0 0 ${20 * grid.scale}px ${glowColor}, inset 0 0 ${10 * grid.scale}px ${glowColor.replace(/[\d.]+\)$/, "0.2)")}`
                      : "none",
                    // 悬停时立即响应，离开后缓慢淡出
                    transitionDuration: isHovered ? "0ms" : "1000ms",
                  }}
                  onMouseEnter={() => setHoveredCell(index)}
                  onMouseLeave={() => setHoveredCell(null)}
                />
              );
            })}
          </div>
        ))}
      </div>

      {/* 中心环境光，让背景不至于只有硬边网格 */}
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-20"
        style={{
          width: "60vmin",
          height: "60vmin",
          background: `radial-gradient(circle, ${glowColor.replace(/[\d.]+\)$/, "0.3)")} 0%, transparent 70%)`,
        }}
      />

      {/* 边缘暗角，把视觉注意力压回页面中心 */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 0%, transparent 30%, rgba(10,10,10,0.8) 100%)",
        }}
      />

      {/* 内容层放在最上面，避免被背景网格遮住 */}
      {children && (
        <div className="relative z-10 h-full w-full">{children}</div>
      )}
    </div>
  );
}

export default function InteractiveGridPatternDemo() {
  // 默认导出演示组件，单独渲染这个背景效果
  return <InteractiveGridPattern />;
}

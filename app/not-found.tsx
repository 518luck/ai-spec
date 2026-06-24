"use client";

import { Button } from "@/shared/ui/button";
import { Home, RefreshCcw } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";

// RGB 色道分离的故障配色，screen 混合模式下叠加成主体
const CHANNEL_RED = "#ff004c";
const CHANNEL_CYAN = "#00f0ff";

// 单层故障文字：通过 ::before/::after 伪元素做红青色道分离
type FaultLayerProps = { label: string };

function FaultLayer({ label }: FaultLayerProps) {
  return (
    <span
      className="fault-layer text-foreground font-mono text-[18vw] leading-none font-bold tracking-wider select-none"
      data-label={label}
    >
      {label}
    </span>
  );
}

// 故障文字控制器：用 ref 直接操作 DOM，setInterval 内做随机剪裁与位移，返回可手动触发的函数
function useFaultEffect(containerRef: React.RefObject<HTMLDivElement | null>) {
  const triggerRef = useRef<() => void>(() => {});

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const layers = Array.from(
      container.querySelectorAll<HTMLElement>(".fault-layer"),
    );
    let timer: ReturnType<typeof setInterval> | undefined;
    let stopTimer: ReturnType<typeof setTimeout> | undefined;

    // 触发一次持续约 1 秒的故障爆发
    const trigger = () => {
      clearInterval(timer);
      timer = setInterval(() => {
        layers.forEach((layer) => {
          const x = Math.random() * 60 - 30;
          const y = Math.random() * 60 - 30;
          const cx = Math.random() * 100;
          const cy = Math.random() * 100;
          const h = Math.random() * 50 + 50;
          const w = Math.random() * 40 + 10;
          layer.classList.add("fault-active");
          layer.style.transform = `translate(${x}%, ${y}%)`;
          layer.style.clipPath = `polygon(${cx}% ${cy}%, ${cx + w}% ${cy}%, ${cx + w}% ${cy + h}%, ${cx}% ${cy + h}%)`;
        });
      }, 30);
      stopTimer = setTimeout(() => {
        clearInterval(timer);
        layers.forEach((layer) => {
          layer.classList.remove("fault-active");
          layer.style.transform = "";
          layer.style.clipPath = "";
        });
      }, 1000);
    };

    // 暴露给外部点击调用
    triggerRef.current = trigger;

    // 初始触发一次，之后每隔 4 秒自动故障
    const loop = setInterval(trigger, 4500);
    trigger();

    return () => {
      clearInterval(timer);
      clearTimeout(stopTimer);
      clearInterval(loop);
    };
  }, [containerRef]);

  return () => triggerRef.current();
}

// 全局 404 页面：clip-path 故障艺术风格，呼应「信号中断」主题
function NotFoundPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const trigger = useFaultEffect(containerRef);

  return (
    <main className="bg-background relative flex min-h-svh w-full flex-col items-center justify-center overflow-hidden">
      {/* 故障文字容器：点击触发一次故障爆发 */}
      <div
        ref={containerRef}
        className="relative flex cursor-pointer items-center justify-center"
        onClick={trigger}
        role="presentation"
      >
        <FaultLayer label="404" />
        <FaultLayer label="404" />
        <FaultLayer label="404" />
        <FaultLayer label="404" />
      </div>

      {/* 故障伪元素的色道分离样式，screen 混合需在深色场景下生效 */}
      <style>{`
        .fault-layer {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 30ms linear;
        }
        .fault-layer:first-child {
          position: relative;
        }
        .fault-active::before,
        .fault-active::after {
          content: attr(data-label);
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          mix-blend-mode: screen;
        }
        .fault-active::before {
          color: ${CHANNEL_CYAN};
          transform: translateX(-2%);
        }
        .fault-active::after {
          color: ${CHANNEL_RED};
          transform: translateX(2%);
        }
      `}</style>

      {/* 文案与操作区 */}
      <div className="relative z-10 mt-12 flex flex-col items-center gap-6 text-center">
        <div>
          <p className="text-foreground text-sm font-medium">你漂到了一座孤岛</p>
          <p className="text-muted-foreground mt-1 text-xs">
            四面环海，信号断了。点击上方的「404」也许能重新捕获讯号。
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button
            size="sm"
            className="h-8 gap-2 text-xs"
            nativeButton={false}
            render={<Link href="/spec/personal/records" />}
          >
            <Home className="size-3.5" />
            返回首页
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-2 text-xs"
            onClick={() => window.history.back()}
          >
            <RefreshCcw className="size-3.5" />
            返回上一页
          </Button>
        </div>
      </div>
    </main>
  );
}

export default NotFoundPage;

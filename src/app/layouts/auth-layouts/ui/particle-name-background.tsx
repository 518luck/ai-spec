"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/shared/lib/utils";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  tx: number;
  ty: number;
  size: number;
  alpha: number;
  revealAt: number; // 粒子在 intro 阶段开始出现的时间点
  hue: number; // 粒子的独立色相，让整体颜色不是单一纯色
};

export interface ParticleNameBackgroundProps {
  className?: string;
  children?: React.ReactNode;
  text?: string;
  glowColor?: string;
  particleCount?: number;
  fontFamily?: string;
  fontWeight?: number;
  scatterForce?: number;
  interactionRadius?: number;
  baseHue?: number;
  hueRange?: number;
  textVerticalAlign?: number;
}

const DPR_LIMIT = 2;

export function ParticleNameBackground({
  className, // 外层容器附加类名
  children, // 叠加在粒子背景上的前景内容
  text = "AI SPEC", // 默认要拼出的文字内容
  glowColor = "rgba(196, 181, 253, 0.38)", // 粒子发光颜色，默认使用偏紫的雾感高光
  particleCount = 500, // 最大粒子数量
  fontFamily = "ui-sans-serif, system-ui, sans-serif", // 文字采样使用的字体
  fontWeight = 700, // 文字采样使用的字重
  scatterForce = 1.2, // 鼠标扰动时的排斥力度
  interactionRadius = 90, // 鼠标影响粒子的作用半径
  baseHue = 270, // 基础色相，默认落在梦幻紫附近
  hueRange = 90, // 色相浮动范围，用来覆盖蓝紫到粉紫的综合色带
  textVerticalAlign = 0.5, // 控制文字在容器内部的垂直位置，0.5 表示默认居中
}: ParticleNameBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const offscreen = document.createElement("canvas"); // 离屏画布，用来把文字转成像素采样点
    const offscreenCtx = offscreen.getContext("2d", {
      willReadFrequently: true,
    });
    if (!offscreenCtx) return;

    const mouse = {
      x: -9999,
      y: -9999,
      active: false, // 只在鼠标进入组件后启用排斥效果
    };

    let width = 0;
    let height = 0;
    let particles: Particle[] = []; // 当前所有粒子实例
    let introProgress = 0; // 控制初始云团到文字的收束进度

    const getFontSize = () => {
      const shortest = Math.min(width, height);
      return Math.max(34, Math.min(88, shortest * 0.32));
    };

    const createTargets = () => {
      const fontSize = getFontSize();
      const sampleGap = Math.max(2, Math.round(fontSize / 22)); // 提高采样密度，避免标题笔画缺失得太厉害

      // 离屏采样直接使用逻辑尺寸，避免在窗口缩放和高分屏下出现目标点偏移
      offscreen.width = Math.max(1, width);
      offscreen.height = Math.max(1, height);
      offscreenCtx.setTransform(1, 0, 0, 1, 0, 0);
      offscreenCtx.clearRect(0, 0, width, height);
      offscreenCtx.fillStyle = "#ffffff";
      offscreenCtx.textAlign = "center";
      offscreenCtx.textBaseline = "middle";
      offscreenCtx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
      offscreenCtx.fillText(text, width / 2, height * textVerticalAlign);

      const imageData = offscreenCtx.getImageData(0, 0, width, height).data; // 读取文字像素，提取可落点区域
      const points: Array<{ x: number; y: number }> = [];

      for (let y = 0; y < height; y += sampleGap) {
        for (let x = 0; x < width; x += sampleGap) {
          const alpha = imageData[(y * width + x) * 4 + 3];
          if (alpha > 80) {
            points.push({ x, y });
          }
        }
      }

      return points;
    };

    const createParticles = () => {
      introProgress = 0; // 重新布局时让 intro 动画从头开始
      const targets = createTargets();
      const shuffledTargets = [...targets].sort(() => Math.random() - 0.5); // 打乱目标点，避免出现顺序感
      const limitedTargets = shuffledTargets.slice(
        0,
        Math.min(particleCount, shuffledTargets.length),
      );
      const cloudRadiusX = width * 0.18; // 初始云团横向半径
      const cloudRadiusY = height * 0.24; // 初始云团纵向半径
      const centerX = width * 0.5;
      const centerY = height * 0.5;

      particles = limitedTargets.map((point) => {
        const angle = Math.random() * Math.PI * 2;
        const radiusX = Math.sqrt(Math.random()) * cloudRadiusX; // 用 sqrt 让分布更接近均匀云团
        const radiusY = Math.sqrt(Math.random()) * cloudRadiusY;
        const startX = centerX + Math.cos(angle) * radiusX;
        const startY = centerY + Math.sin(angle) * radiusY;
        return {
          x: startX,
          y: startY,
          vx: (Math.random() - 0.5) * 0.6, // 给一点初速度，避免云团完全静止
          vy: (Math.random() - 0.5) * 0.6,
          tx: point.x,
          ty: point.y,
          size: 0.9 + Math.random() * 1.1,
          alpha: 0.72 + Math.random() * 0.28,
          revealAt: Math.random() * 0.72,
          hue: baseHue + (Math.random() - 0.5) * hueRange,
        };
      });
    };

    const resize = () => {
      const rect = container.getBoundingClientRect();
      width = Math.max(1, Math.floor(rect.width));
      height = Math.max(1, Math.floor(rect.height));

      const dpr = Math.min(window.devicePixelRatio || 1, DPR_LIMIT); // 限制 DPR，避免高分屏粒子动画过重
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      createParticles();
    };

    const drawBackground = () => {
      ctx.clearRect(0, 0, width, height); // 背景透明，只清空上一帧粒子
    };

    const animate = () => {
      drawBackground();
      introProgress = Math.min(1, introProgress + 0.012);
      const attractionStrength = 0.004 + 0.014 * introProgress;
      ctx.save();
      ctx.globalCompositeOperation = "lighter";

      for (const particle of particles) {
        const revealProgress = Math.min(1, Math.max(0, (introProgress - particle.revealAt) / 0.2));
        if (revealProgress <= 0) continue;

        const toTargetX = particle.tx - particle.x;
        const toTargetY = particle.ty - particle.y;

        particle.vx += toTargetX * attractionStrength * revealProgress;
        particle.vy += toTargetY * attractionStrength * revealProgress;

        const dx = particle.x - mouse.x;
        const dy = particle.y - mouse.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (mouse.active && distance < interactionRadius) {
          const force = (1 - distance / interactionRadius) * scatterForce;
          const angle = Math.atan2(dy, dx);
          particle.vx += Math.cos(angle) * force * 2.4;
          particle.vy += Math.sin(angle) * force * 2.4;
        }

        particle.vx *= 0.88;
        particle.vy *= 0.88;
        particle.x += particle.vx;
        particle.y += particle.vy;

        const glowAlpha = particle.alpha * revealProgress * 0.15;
        const coreAlpha = particle.alpha * revealProgress;

        ctx.beginPath();
        ctx.fillStyle = `hsla(${particle.hue}, 100%, 70%, ${glowAlpha})`;
        ctx.arc(particle.x, particle.y, particle.size * 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.fillStyle = `hsla(${particle.hue}, 100%, ${58 - revealProgress * 6}%, ${coreAlpha})`;
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      frameRef.current = requestAnimationFrame(animate);
    };

    const handlePointerMove = (event: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = event.clientX - rect.left; // 转成相对容器的局部坐标
      mouse.y = event.clientY - rect.top;
      mouse.active = true;
    };

    const handlePointerLeave = () => {
      mouse.x = -9999;
      mouse.y = -9999;
      mouse.active = false;
    };

    resize();
    animate();

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    container.addEventListener("pointermove", handlePointerMove);
    container.addEventListener("pointerleave", handlePointerLeave);

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
      resizeObserver.disconnect();
      container.removeEventListener("pointermove", handlePointerMove);
      container.removeEventListener("pointerleave", handlePointerLeave);
    };
  }, [
    fontFamily,
    fontWeight,
    baseHue,
    hueRange,
    interactionRadius,
    particleCount,
    scatterForce,
    text,
    textVerticalAlign,
  ]);

  return (
    <div ref={containerRef} className={cn("relative overflow-hidden rounded-[28px]", className)}>
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

      {children ? <div className="relative z-10 h-full w-full">{children}</div> : null}
    </div>
  );
}

export default function ParticleNameBackgroundDemo() {
  return <ParticleNameBackground className="h-44 w-full max-w-md" />;
}

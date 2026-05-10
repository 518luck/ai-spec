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
};

export interface ParticleNameBackgroundProps {
  className?: string;
  children?: React.ReactNode;
  text?: string;
  textColor?: string;
  glowColor?: string;
  particleCount?: number;
  fontFamily?: string;
  fontWeight?: number;
  scatterForce?: number;
  interactionRadius?: number;
}

const DPR_LIMIT = 2;

export function ParticleNameBackground({
  className, // 外层容器附加类名
  children, // 叠加在粒子背景上的前景内容
  text = "AI SPEC", // 默认要拼出的文字内容
  textColor = "rgba(244, 244, 229, 0.92)", // 粒子本体颜色
  glowColor = "rgba(148, 163, 184, 0.35)", // 粒子发光颜色
  particleCount = 900, // 最大粒子数量
  fontFamily = "ui-sans-serif, system-ui, sans-serif", // 文字采样使用的字体
  fontWeight = 700, // 文字采样使用的字重
  scatterForce = 1.2, // 鼠标扰动时的排斥力度
  interactionRadius = 90, // 鼠标影响粒子的作用半径
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

    const offscreen = document.createElement("canvas");
    const offscreenCtx = offscreen.getContext("2d", {
      willReadFrequently: true,
    });
    if (!offscreenCtx) return;

    const mouse = {
      x: -9999,
      y: -9999,
      active: false,
    };

    let width = 0;
    let height = 0;
    let particles: Particle[] = [];

    const getFontSize = () => {
      const shortest = Math.min(width, height);
      return Math.max(34, Math.min(88, shortest * 0.32));
    };

    const createTargets = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, DPR_LIMIT);
      const fontSize = getFontSize();
      const sampleGap = Math.max(4, Math.round(fontSize / 16));

      offscreen.width = Math.max(1, Math.floor(width * dpr));
      offscreen.height = Math.max(1, Math.floor(height * dpr));
      offscreenCtx.setTransform(1, 0, 0, 1, 0, 0);
      offscreenCtx.scale(dpr, dpr);
      offscreenCtx.clearRect(0, 0, width, height);
      offscreenCtx.fillStyle = "#ffffff";
      offscreenCtx.textAlign = "center";
      offscreenCtx.textBaseline = "middle";
      offscreenCtx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
      offscreenCtx.fillText(text, width / 2, height / 2);

      const imageData = offscreenCtx.getImageData(0, 0, width, height).data;
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
      const targets = createTargets();
      const limitedTargets = targets.slice(
        0,
        Math.min(particleCount, targets.length),
      );

      particles = limitedTargets.map((point) => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: 0,
        vy: 0,
        tx: point.x,
        ty: point.y,
        size: 1 + Math.random() * 1.8,
        alpha: 0.45 + Math.random() * 0.5,
      }));
    };

    const resize = () => {
      const rect = container.getBoundingClientRect();
      width = Math.max(1, Math.floor(rect.width));
      height = Math.max(1, Math.floor(rect.height));

      const dpr = Math.min(window.devicePixelRatio || 1, DPR_LIMIT);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      createParticles();
    };

    const drawBackground = () => {
      ctx.clearRect(0, 0, width, height);
    };

    const animate = () => {
      drawBackground();

      for (const particle of particles) {
        const toTargetX = particle.tx - particle.x;
        const toTargetY = particle.ty - particle.y;

        particle.vx += toTargetX * 0.018;
        particle.vy += toTargetY * 0.018;

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

        ctx.beginPath();
        ctx.fillStyle = textColor.replace(/[\d.]+\)$/, `${particle.alpha})`);
        ctx.shadowBlur = 12;
        ctx.shadowColor = glowColor;
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      }

      frameRef.current = requestAnimationFrame(animate);
    };

    const handlePointerMove = (event: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = event.clientX - rect.left;
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
    glowColor,
    interactionRadius,
    particleCount,
    scatterForce,
    text,
    textColor,
  ]);

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-hidden rounded-[28px]", className)}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
      />

      {children ? (
        <div className="relative z-10 h-full w-full">{children}</div>
      ) : null}
    </div>
  );
}

export default function ParticleNameBackgroundDemo() {
  return <ParticleNameBackground className="h-44 w-full max-w-md" />;
}

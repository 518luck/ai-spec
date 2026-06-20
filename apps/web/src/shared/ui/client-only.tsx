"use client";

import { AnimatePresence, motion } from "motion/react";
import { type ReactNode, useSyncExternalStore } from "react";

type ClientOnlyProps = {
  children: ReactNode;
  fallback?: ReactNode;
  fadeInDuration?: number;
  className?: string;
};

// 只在浏览器客户端渲染 children，避免 SSR 和 hydration 不一致
export function ClientOnly({
  children,
  fallback,
  fadeInDuration = 0.5,
  className,
}: ClientOnlyProps): ReactNode {
  const clientReady = useSyncExternalStore(
    (onStoreChange) => {
      onStoreChange();
      return () => {};
    },
    () => true,
    () => false,
  );

  const Comp = fadeInDuration ? motion.div : "div";

  return (
    <AnimatePresence>
      {clientReady ? (
        <Comp
          {...(fadeInDuration
            ? {
                initial: { opacity: 0 },
                animate: { opacity: 1 },
                transition: { duration: fadeInDuration },
              }
            : {})}
          className={className}
        >
          {children}
        </Comp>
      ) : (
        fallback ?? null
      )}
    </AnimatePresence>
  );
}

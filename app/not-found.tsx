"use client";

import { Button } from "@/shared/ui/button";
import { Home, RefreshCcw } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";

// 全局 404 页面：带入场动画，复用根布局主题，提供回首页与返回入口
function NotFoundPage() {
  return (
    <section className="mx-auto w-full max-w-2xl p-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <div className="flex min-h-125 flex-col items-center justify-center px-4 py-16 text-center">
          <motion.h1
            className="mb-6 text-7xl font-semibold tracking-tight tabular-nums"
            initial={{ opacity: 0, scale: 0.5, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 20,
              delay: 0.1,
            }}
          >
            404
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.4,
              delay: 0.3,
              ease: "easeOut",
            }}
          >
            <h2 className="mb-2 text-lg font-medium">页面走丢了</h2>
            <p className="text-muted-foreground mb-8 text-sm">
              你访问的页面好像消失在了茫茫宇宙中，找不到了。
            </p>
          </motion.div>

          <motion.div
            className="flex flex-wrap items-center justify-center gap-2"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.4,
              delay: 0.4,
              ease: "easeOut",
            }}
          >
            <Button
              size="sm"
              className="h-8 gap-2 text-xs"
              nativeButton={false}
              render={<Link href="/spec/discover" />}
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
          </motion.div>

          <motion.div
            className="mt-8 flex items-center gap-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.5, ease: "easeOut" }}
          >
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="bg-muted-foreground/40 size-1.5 rounded-full"
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.4, 0.8, 0.4],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: "easeInOut",
                }}
              />
            ))}
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}

export default NotFoundPage;

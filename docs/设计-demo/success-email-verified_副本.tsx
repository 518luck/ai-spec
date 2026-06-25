"use client"

import { motion } from "framer-motion"
import { ArrowRight, CheckCircle2, Loader2, MailCheck } from "lucide-react"
import { useEffect, useState } from "react"
import { Balancer } from "react-wrap-balancer"
import { Button } from "~/components/ui/button"

export default function SuccessEmailVerified() {
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    if (countdown <= 0) return

    const timer = setInterval(() => {
      setCountdown(prev => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [countdown])

  const containerVariants = {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  }

  const itemVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
  }

  return (
    <section className="mx-auto w-full max-w-2xl p-4">
      <motion.div
        variants={containerVariants}
        initial="initial"
        animate="animate"
        className="overflow-hidden rounded-lg border bg-card text-card-foreground"
      >
        {/* Header Section */}
        <motion.div variants={itemVariants} className="border-b px-4 py-8 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-blue-500/10 mb-5 relative">
            <MailCheck className="size-7 text-blue-500" />
            <motion.div
              className="absolute -right-1 -bottom-1 size-6 rounded-full bg-background border flex items-center justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: "spring" }}
            >
              <CheckCircle2 className="size-4 text-emerald-500" />
            </motion.div>
          </div>
          <h2 className="text-sm font-medium">Email address verified</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            <Balancer>
              Thank you for verifying your email. Your account is now fully active and ready to use.
            </Balancer>
          </p>
        </motion.div>

        {/* Redirect Section */}
        <motion.div variants={itemVariants} className="border-b px-4 py-6 text-center bg-muted/20">
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground uppercase tracking-widest">
              <Loader2 className="size-3 animate-spin" />
              Redirecting in {countdown}s
            </div>
            <div className="w-full max-w-[200px] h-1 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-blue-500"
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 5, ease: "linear" }}
              />
            </div>
          </div>
        </motion.div>

        {/* Info Section */}
        <motion.div variants={itemVariants} className="border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">
                Account ID
              </span>
              <span className="text-[11px] font-mono bg-muted px-1.5 py-0.5 rounded">
                usr_294x92
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">
                Status
              </span>
              <span className="text-[11px] text-emerald-500 font-medium">Active</span>
            </div>
          </div>
        </motion.div>

        {/* Footer Section */}
        <motion.div variants={itemVariants} className="px-4 py-3 flex justify-center bg-muted/50">
          <Button size="sm" className="h-8 text-xs gap-1.5 px-8">
            Go to Dashboard
            <ArrowRight className="size-3" />
          </Button>
        </motion.div>
      </motion.div>
    </section>
  )
}

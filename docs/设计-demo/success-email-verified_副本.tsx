"use client";

import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Loader2, MailCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { Balancer } from "react-wrap-balancer";
import { Button } from "~/components/ui/button";

export default function SuccessEmailVerified() {
	const [countdown, setCountdown] = useState(5);

	useEffect(() => {
		if (countdown <= 0) return;

		const timer = setInterval(() => {
			setCountdown((prev) => prev - 1);
		}, 1000);

		return () => clearInterval(timer);
	}, [countdown]);

	const containerVariants = {
		initial: { opacity: 0 },
		animate: {
			opacity: 1,
			transition: {
				staggerChildren: 0.05,
			},
		},
	};

	const itemVariants = {
		initial: { opacity: 0, y: 10 },
		animate: { opacity: 1, y: 0 },
	};

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
					<div className="relative mx-auto mb-5 flex size-14 items-center justify-center rounded-full bg-blue-500/10">
						<MailCheck className="size-7 text-blue-500" />
						<motion.div
							className="absolute -right-1 -bottom-1 flex size-6 items-center justify-center rounded-full border bg-background"
							initial={{ scale: 0 }}
							animate={{ scale: 1 }}
							transition={{ delay: 0.5, type: "spring" }}
						>
							<CheckCircle2 className="size-4 text-emerald-500" />
						</motion.div>
					</div>
					<h2 className="font-medium text-sm">Email address verified</h2>
					<p className="mt-1 text-muted-foreground text-xs">
						<Balancer>
							Thank you for verifying your email. Your account is now fully active and ready to use.
						</Balancer>
					</p>
				</motion.div>

				{/* Redirect Section */}
				<motion.div variants={itemVariants} className="border-b bg-muted/20 px-4 py-6 text-center">
					<div className="flex flex-col items-center gap-3">
						<div className="flex items-center gap-2 font-medium text-[11px] text-muted-foreground uppercase tracking-widest">
							<Loader2 className="size-3 animate-spin" />
							Redirecting in {countdown}s
						</div>
						<div className="h-1 w-full max-w-[200px] overflow-hidden rounded-full bg-muted">
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
							<span className="font-medium text-[11px] text-muted-foreground uppercase tracking-wider">
								Account ID
							</span>
							<span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
								usr_294x92
							</span>
						</div>
						<div className="flex items-center gap-2">
							<span className="font-medium text-[11px] text-muted-foreground uppercase tracking-wider">
								Status
							</span>
							<span className="font-medium text-[11px] text-emerald-500">Active</span>
						</div>
					</div>
				</motion.div>

				{/* Footer Section */}
				<motion.div variants={itemVariants} className="flex justify-center bg-muted/50 px-4 py-3">
					<Button size="sm" className="h-8 gap-1.5 px-8 text-xs">
						Go to Dashboard
						<ArrowRight className="size-3" />
					</Button>
				</motion.div>
			</motion.div>
		</section>
	);
}

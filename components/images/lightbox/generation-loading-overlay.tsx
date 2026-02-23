"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Sparkles } from "lucide-react";

export interface GenerationLoadingOverlayProps {
	isGenerating: boolean;
	prompt?: string;
}

export function GenerationLoadingOverlay({
	isGenerating,
	prompt,
}: GenerationLoadingOverlayProps) {
	return (
		<AnimatePresence>
			{isGenerating && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{ duration: 0.2 }}
					className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
				>
					<motion.div
						initial={{ scale: 0.9, opacity: 0 }}
						animate={{ scale: 1, opacity: 1 }}
						exit={{ scale: 0.9, opacity: 0 }}
						transition={{ delay: 0.1, duration: 0.2 }}
						className="flex flex-col items-center gap-4 p-6 rounded-2xl bg-card/90 border border-border/50 shadow-2xl max-w-sm mx-4"
					>
						<div className="relative">
							<Loader2 className="h-10 w-10 animate-spin text-primary" />
							<Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-yellow-400 animate-pulse" />
						</div>
						<div className="text-center space-y-1">
							<p className="font-semibold text-foreground">
								Generating your edit...
							</p>
							{prompt && (
								<p className="text-sm text-muted-foreground line-clamp-2 max-w-[200px]">
									&ldquo;{prompt}&rdquo;
								</p>
							)}
						</div>
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}

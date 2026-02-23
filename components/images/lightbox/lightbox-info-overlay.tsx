"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import type * as React from "react";
import type { LightboxImage } from "@/hooks/use-image-lightbox";
import { getModelDisplayName } from "@/lib/config/models";

export interface LightboxInfoOverlayProps {
	image: LightboxImage;
	isLoadingDetails: boolean;
	isVisible: boolean;
	onHoverChange: (isHovering: boolean) => void;
	children?: React.ReactNode;
	footer?: React.ReactNode;
}

export function LightboxInfoOverlay({
	image,
	isLoadingDetails,
	isVisible,
	onHoverChange,
	children,
	footer,
}: LightboxInfoOverlayProps) {
	return (
		<AnimatePresence>
			{isVisible && (
				<motion.div
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: 10 }}
					transition={{ duration: 0.125, ease: "easeOut" }}
					className="absolute bottom-0 inset-x-0 p-6 pt-8 bg-gradient-to-t from-black/70 via-black/60 to-transparent pointer-events-none z-20"
				>
					<section
						aria-label="Image details"
						onMouseEnter={() => onHoverChange(true)}
						onMouseLeave={() => onHoverChange(false)}
						className="flex items-end justify-between gap-8 pointer-events-auto max-w-[1400px] mx-auto w-full px-4 md:px-6"
					>
						<div className="flex flex-col gap-3 max-w-3xl">
							{isLoadingDetails ? (
								<div className="flex items-center gap-2 text-white/60">
									<Loader2 className="h-4 w-4 animate-spin" />
									<span className="text-sm">Loading details...</span>
								</div>
							) : (
								<>
									<p className="text-white text-sm md:text-base font-medium leading-relaxed line-clamp-2 antialiased drop-shadow-sm">
										{image.prompt}
									</p>

									<div className="flex flex-wrap items-center gap-2">
										{(image.params?.model || image.model) && (
											<div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/10 text-white/90 backdrop-blur-md transition-colors shadow-sm">
												<div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
												<span className="text-[10px] md:text-xs font-bold uppercase tracking-widest">
													{getModelDisplayName(
														image.params?.model || image.model || "",
													) ||
														image.params?.model ||
														image.model ||
														"Unknown"}
												</span>
											</div>
										)}
										{(image.params?.width || image.width) && (
											<div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/10 text-white/90 text-[10px] md:text-xs font-medium backdrop-blur-md transition-colors shadow-sm">
												<span className="text-white/40">Size</span>
												<span className="font-mono">
													{image.params?.width || image.width}×
													{image.params?.height || image.height}
												</span>
											</div>
										)}
										{(image.params?.seed || image.seed) &&
											image.params?.seed !== -1 &&
											image.seed !== -1 && (
												<div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/10 text-white/90 text-[10px] md:text-xs font-medium backdrop-blur-md transition-colors shadow-sm">
													<span className="text-white/40">Seed</span>
													<span className="font-mono">
														{image.params?.seed || image.seed}
													</span>
												</div>
											)}
									</div>
								</>
							)}
						</div>

						<div className="flex items-center gap-2">{children}</div>
					</section>

					{footer && (
						<div className="pointer-events-auto max-w-[1400px] mx-auto w-full px-4 md:px-6 pt-4">
							{footer}
						</div>
					)}
				</motion.div>
			)}
		</AnimatePresence>
	);
}

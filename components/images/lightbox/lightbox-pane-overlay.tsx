"use client";

import { AnimatePresence, motion } from "framer-motion";
import { BookmarkPlus, Check, Copy, LogIn, Wand2 } from "lucide-react";
import Link from "next/link";
import type * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import type { LightboxImage } from "@/hooks/use-image-lightbox";
import { getModelDisplayName } from "@/lib/config/models";

export interface LightboxPaneOverlayProps {
	/** The image data to display metadata for */
	image: LightboxImage;
	/** Whether the overlay should be visible */
	isVisible: boolean;
	/** Whether the user is signed in (for auth-gating actions) */
	isSignedIn: boolean;
	/** Whether this image can be edited (false for videos) */
	canEdit: boolean;
	/** Whether the copy action shows success state */
	copied: boolean;
	/** Callback when Edit button is clicked */
	onEdit: () => void;
	/** Callback when Save to Library button is clicked */
	onSaveToLibrary: () => void;
	/** Callback when Copy Prompt button is clicked */
	onCopyPrompt: (e: React.MouseEvent) => void;
	/** Callback to keep overlay visible while hovering over it */
	onHoverChange: (isHovering: boolean) => void;
}

/**
 * Compact overlay that appears within a lightbox pane on hover.
 * Displays truncated prompt, metadata badges, and action buttons.
 */
export function LightboxPaneOverlay({
	image,
	isVisible,
	isSignedIn,
	canEdit,
	copied,
	onEdit,
	onSaveToLibrary,
	onCopyPrompt,
	onHoverChange,
}: LightboxPaneOverlayProps) {
	const hasPrompt = !!image.prompt;

	const buttonClassName =
		"h-8 w-8 rounded-full bg-white/15 hover:bg-white/25 text-white border border-white/10 backdrop-blur-md transition-all shrink-0 hover:scale-105 active:scale-95 shadow-lg";
	const disabledButtonClassName =
		"h-8 w-8 rounded-full bg-white/10 hover:bg-white/15 text-white/60 hover:text-white border border-white/10 backdrop-blur-md transition-all shrink-0 hover:scale-105 active:scale-95 shadow-lg";

	return (
		<AnimatePresence>
			{isVisible && (
				<motion.div
					initial={{ opacity: 0, y: 8 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: 8 }}
					transition={{ duration: 0.15, ease: "easeOut" }}
					className="absolute bottom-0 inset-x-0 p-3 pt-10 bg-gradient-to-t from-black/80 via-black/50 to-transparent pointer-events-none z-10 rounded-b-sm"
					data-testid="lightbox-pane-overlay"
				>
					<section
						aria-label="Image details and actions"
						className="pointer-events-auto"
						onMouseEnter={() => onHoverChange(true)}
						onMouseLeave={() => onHoverChange(false)}
					>
						{/* Prompt text - truncated to 1 line */}
						{hasPrompt && (
							<p
								className="text-white text-xs font-medium leading-relaxed line-clamp-1 mb-2 antialiased drop-shadow-sm"
								title={image.prompt}
							>
								{image.prompt}
							</p>
						)}

						{/* Metadata + Actions row */}
						<div className="flex items-center justify-between gap-2">
							{/* Metadata badges */}
							<div className="flex flex-wrap items-center gap-1.5 min-w-0 flex-1">
								{(image.params?.model || image.model) && (
									<Badge
										variant="secondary"
										className="bg-white/10 border-white/10 text-white/90 backdrop-blur-md gap-1.5 py-1"
									>
										<span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
										<span className="text-[9px] font-bold uppercase tracking-widest truncate max-w-[80px]">
											{getModelDisplayName(
												image.params?.model || image.model || "",
											) ||
												image.params?.model ||
												image.model ||
												"Unknown"}
										</span>
									</Badge>
								)}
								{(image.params?.width || image.width) && (
									<Badge
										variant="secondary"
										className="hidden sm:inline-flex bg-white/10 border-white/10 text-white/90 text-[9px] font-medium backdrop-blur-md py-1"
									>
										<span className="font-mono">
											{image.params?.width || image.width}×
											{image.params?.height || image.height}
										</span>
									</Badge>
								)}
							</div>

							{/* Action buttons - icons only with tooltips */}
							<div className="flex items-center gap-1.5 shrink-0">
								{/* Edit button */}
								{canEdit &&
									(isSignedIn ? (
										<Tooltip delayDuration={200}>
											<TooltipTrigger asChild>
												<Button
													variant="ghost"
													size="icon"
													className={buttonClassName}
													onClick={(e) => {
														e.stopPropagation();
														onEdit();
													}}
													data-testid="pane-edit-button"
												>
													<Wand2 className="h-4 w-4" />
												</Button>
											</TooltipTrigger>
											<TooltipContent side="top" className="z-[100]">
												<p className="font-medium">Edit Image</p>
											</TooltipContent>
										</Tooltip>
									) : (
										<Tooltip delayDuration={200}>
											<TooltipTrigger asChild>
												<Link
													href="/sign-in"
													onClick={(e) => e.stopPropagation()}
												>
													<Button
														variant="ghost"
														size="icon"
														className={disabledButtonClassName}
														data-testid="pane-edit-signin"
													>
														<Wand2 className="h-4 w-4" />
													</Button>
												</Link>
											</TooltipTrigger>
											<TooltipContent side="top" className="z-[100]">
												<div className="flex items-center gap-2">
													<LogIn className="h-3.5 w-3.5" />
													<p className="font-medium">Sign in to edit</p>
												</div>
											</TooltipContent>
										</Tooltip>
									))}

								{/* Save to Library button */}
								{isSignedIn ? (
									<Tooltip delayDuration={200}>
										<TooltipTrigger asChild>
											<Button
												variant="ghost"
												size="icon"
												className={buttonClassName}
												onClick={(e) => {
													e.stopPropagation();
													onSaveToLibrary();
												}}
												disabled={!hasPrompt}
												data-testid="pane-save-button"
											>
												<BookmarkPlus className="h-4 w-4" />
											</Button>
										</TooltipTrigger>
										<TooltipContent side="top" className="z-[100]">
											<p className="font-medium">Save to Library</p>
										</TooltipContent>
									</Tooltip>
								) : (
									<Tooltip delayDuration={200}>
										<TooltipTrigger asChild>
											<Link
												href="/sign-in"
												onClick={(e) => e.stopPropagation()}
											>
												<Button
													variant="ghost"
													size="icon"
													className={disabledButtonClassName}
													data-testid="pane-save-signin"
												>
													<BookmarkPlus className="h-4 w-4" />
												</Button>
											</Link>
										</TooltipTrigger>
										<TooltipContent side="top" className="z-[100]">
											<div className="flex items-center gap-2">
												<LogIn className="h-3.5 w-3.5" />
												<p className="font-medium">Sign in to save</p>
											</div>
										</TooltipContent>
									</Tooltip>
								)}

								{/* Copy Prompt button */}
								{isSignedIn ? (
									<Tooltip delayDuration={200}>
										<TooltipTrigger asChild>
											<Button
												variant="ghost"
												size="icon"
												className={buttonClassName}
												onClick={onCopyPrompt}
												disabled={!hasPrompt}
												data-testid="pane-copy-button"
											>
												{copied ? (
													<Check className="h-4 w-4 text-green-400" />
												) : (
													<Copy className="h-4 w-4" />
												)}
											</Button>
										</TooltipTrigger>
										<TooltipContent side="top" className="z-[100]">
											<p className="font-medium">
												{copied ? "Copied!" : "Copy prompt"}
											</p>
										</TooltipContent>
									</Tooltip>
								) : (
									<Tooltip delayDuration={200}>
										<TooltipTrigger asChild>
											<Link
												href="/sign-in"
												onClick={(e) => e.stopPropagation()}
											>
												<Button
													variant="ghost"
													size="icon"
													className={disabledButtonClassName}
													data-testid="pane-copy-signin"
												>
													<Copy className="h-4 w-4" />
												</Button>
											</Link>
										</TooltipTrigger>
										<TooltipContent side="top" className="z-[100]">
											<div className="flex items-center gap-2">
												<LogIn className="h-3.5 w-3.5" />
												<p className="font-medium">Sign in to copy</p>
											</div>
										</TooltipContent>
									</Tooltip>
								)}
							</div>
						</div>
					</section>
				</motion.div>
			)}
		</AnimatePresence>
	);
}

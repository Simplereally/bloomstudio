"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Frame, Loader2, SlidersHorizontal, X } from "lucide-react";
import Image from "next/image";
import * as React from "react";
import { ResolutionTierSelector } from "@/components/studio/controls/resolution-tier-selector";
import { Button } from "@/components/ui/button";
import {
	RichTooltipContent,
	Tooltip,
	TooltipTrigger,
} from "@/components/ui/rich-tooltip";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
	formatImageFormatInfo,
	type ImageFormatInfo,
} from "@/lib/utils/detect-image-format";
import type {
	AspectRatio,
	AspectRatioOption,
	ModelConstraints,
	ResolutionTier,
} from "@/types/pollinations";

export interface EditModelOption {
	id: string;
	displayName: string;
	logo?: string;
	description?: string;
}

export interface SourceImageDisplayInfo {
	url: string;
	thumbnailUrl?: string;
	label?: string; // "Original" or "Current"
	formatInfo: ImageFormatInfo | null;
}

export interface EditImagePanelProps {
	isOpen: boolean;
	onClose: () => void;
	editPrompt: string;
	onEditPromptChange: (value: string) => void;
	selectedModel: string;
	onModelChange: (model: string) => void;
	models: readonly EditModelOption[];
	isGenerating: boolean;
	canSubmit: boolean;
	onSubmit: () => void;

	// Source image info for display
	sourceImage?: SourceImageDisplayInfo;

	// Aspect ratio and resolution props
	selectedAspectRatio?: AspectRatio;
	onAspectRatioChange?: (ratio: AspectRatio) => void;
	availableAspectRatios?: readonly AspectRatioOption[];
	selectedResolutionTier?: ResolutionTier;
	onResolutionTierChange?: (tier: ResolutionTier) => void;
	modelConstraints?: ModelConstraints;
	outputWidth?: number;
	outputHeight?: number;

	/**
	 * When true, renders without backdrop overlay and uses different positioning.
	 * Used in comparison mode where the panel is docked in a reserved grid column.
	 */
	isDocked?: boolean;
}

// Active selection styling - matching studio controls
const activeClasses =
	"bg-emerald-500/15 text-emerald-700 border border-emerald-500 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500 ring-1 ring-emerald-500/20";

export function EditImagePanel({
	isOpen,
	onClose,
	editPrompt,
	onEditPromptChange,
	selectedModel,
	onModelChange,
	models,
	isGenerating,
	canSubmit,
	onSubmit,
	sourceImage,
	selectedAspectRatio,
	onAspectRatioChange,
	availableAspectRatios,
	selectedResolutionTier,
	onResolutionTierChange,
	modelConstraints,
	outputWidth,
	outputHeight,
	isDocked = false,
}: EditImagePanelProps) {
	const textareaRef = React.useRef<HTMLTextAreaElement>(null);

	React.useEffect(() => {
		if (isOpen && textareaRef.current) {
			textareaRef.current.focus();
		}
	}, [isOpen]);

	const handleKeyDown = React.useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && canSubmit) {
				e.preventDefault();
				onSubmit();
			}
			if (e.key === "Escape") {
				e.preventDefault();
				onClose();
			}
		},
		[canSubmit, onSubmit, onClose],
	);

	// Show aspect ratio controls if we have the necessary props
	const showAspectRatioControls =
		selectedAspectRatio &&
		onAspectRatioChange &&
		availableAspectRatios &&
		availableAspectRatios.length > 0;

	// Show resolution tier controls if we have constraints
	const showResolutionTierControls =
		selectedResolutionTier && onResolutionTierChange && modelConstraints;

	// Panel content (shared between docked and overlay modes)
	const panelContent = (
		<>
			{/* Header with source image context */}
			<div className="flex items-center justify-between p-4 border-b border-border/50">
				<div className="flex items-center gap-3 min-w-0">
					{/* Source image thumbnail */}
					{sourceImage && (
						<div className="relative h-10 w-10 rounded-md overflow-hidden bg-muted flex-shrink-0 border border-border/50">
							<Image
								src={sourceImage.thumbnailUrl || sourceImage.url}
								alt="Source image"
								fill
								className="object-cover"
								sizes="40px"
							/>
						</div>
					)}
					<div className="min-w-0">
						<h3 className="text-sm font-semibold truncate">
							{sourceImage?.label
								? `Editing ${sourceImage.label}`
								: "Edit Image"}
						</h3>
						{/* Source format info badge */}
						{sourceImage?.formatInfo && (
							<p className="text-[11px] text-muted-foreground tabular-nums truncate">
								Source: {formatImageFormatInfo(sourceImage.formatInfo)}
							</p>
						)}
					</div>
				</div>
				<Button
					variant="ghost"
					size="icon"
					onClick={onClose}
					className="h-8 w-8 rounded-full flex-shrink-0"
				>
					<X className="h-4 w-4" />
				</Button>
			</div>

			<div className="flex-1 overflow-y-auto p-4 space-y-4">
				{/* Prompt input */}
				<div className="space-y-[9px]">
					<label
						htmlFor="edit-prompt"
						className="text-sm font-medium text-muted-foreground"
					>
						Prompt
					</label>
					<Textarea
						ref={textareaRef}
						id="edit-prompt"
						placeholder="Describe the changes you want..."
						value={editPrompt}
						onChange={(e) => onEditPromptChange(e.target.value)}
						className="min-h-[80px] resize-none"
						disabled={isGenerating}
					/>
				</div>

				{/* Aspect Ratio Section */}
				{showAspectRatioControls && (
					<fieldset className="space-y-2">
						<div className="flex items-center justify-between">
							<legend className="text-sm font-medium text-muted-foreground flex items-center gap-2">
								<Frame className="h-3.5 w-3.5" />
								Output Format
							</legend>
							{showResolutionTierControls && (
								<ResolutionTierSelector
									selectedTier={selectedResolutionTier}
									onTierChange={onResolutionTierChange}
									constraints={modelConstraints}
									disabled={isGenerating}
									compact
								/>
							)}
						</div>

						{/* Compact aspect ratio grid - 4 columns */}
						<div
							className="grid grid-cols-4 gap-1"
							role="radiogroup"
							data-testid="edit-aspect-ratio-buttons"
						>
							{availableAspectRatios.map((ratio) => {
								const isSelected = selectedAspectRatio === ratio.value;
								const isCustom = ratio.value === "custom";

								return (
									<Tooltip key={ratio.value}>
										<TooltipTrigger asChild>
											<Button
												variant="outline"
												size="sm"
												onClick={() => onAspectRatioChange(ratio.value)}
												disabled={isGenerating}
												className={cn(
													"flex flex-col items-center justify-center h-16 py-2 px-1 transition-all",
													isSelected && activeClasses,
												)}
												data-testid={`edit-ratio-${ratio.value.replace(":", "-")}`}
											>
												{/* Visual ratio preview box */}
												<div className="flex items-center justify-center h-7 w-full">
													<div
														className={cn(
															"flex items-center justify-center border rounded-sm transition-colors",
															isSelected
																? "border-emerald-500/50 bg-emerald-500/30"
																: "border-zinc-500/40 bg-accent dark:bg-background/50",
														)}
														style={{
															width: isCustom
																? 20
																: Math.min(
																		20,
																		20 *
																			(ratio.width /
																				Math.max(ratio.width, ratio.height)),
																	),
															height: isCustom
																? 20
																: Math.min(
																		20,
																		20 *
																			(ratio.height /
																				Math.max(ratio.width, ratio.height)),
																	),
														}}
													>
														{isCustom && (
															<SlidersHorizontal
																className={cn(
																	"h-2.5 w-2.5",
																	isSelected
																		? "text-emerald-600 dark:text-emerald-400"
																		: "text-muted-foreground",
																)}
															/>
														)}
													</div>
												</div>

												{/* Label */}
												<span
													className={cn(
														"text-[10px] font-semibold leading-none truncate w-full text-center mt-1",
														isSelected &&
															"text-emerald-700 dark:text-emerald-400",
													)}
												>
													{isCustom ? "Custom" : ratio.value}
												</span>
											</Button>
										</TooltipTrigger>
										<RichTooltipContent>
											<p className="font-semibold text-sm">{ratio.label}</p>
											{ratio.tags && ratio.tags.length > 0 && (
												<p className="text-xs text-muted-foreground mt-1">
													{ratio.tags.slice(0, 2).join(", ")}
												</p>
											)}
										</RichTooltipContent>
									</Tooltip>
								);
							})}
						</div>

						{/* Output dimensions display */}
						{outputWidth && outputHeight && (
							<div className="flex items-center justify-between px-1">
								<span className="text-[11px] text-muted-foreground">
									Output
								</span>
								<span className="text-[11px] font-medium tabular-nums text-muted-foreground">
									{outputWidth}×{outputHeight}
								</span>
							</div>
						)}
					</fieldset>
				)}

				{/* Model Selection */}
				<fieldset className="space-y-2">
					<legend className="text-sm font-medium text-muted-foreground">
						Model
					</legend>
					<div
						className="grid grid-cols-2 gap-1.5"
						role="radiogroup"
						data-testid="edit-model-buttons"
					>
						{models.map((model) => {
							const isSelected = selectedModel === model.id;
							const isMonochrome =
								model.logo?.includes("openai.svg") ||
								model.logo?.includes("flux.svg") ||
								model.logo?.includes("xai.svg");

							return (
								<Tooltip key={model.id}>
									<TooltipTrigger asChild>
										<Button
											variant={isSelected ? "secondary" : "ghost"}
											size="sm"
											onClick={() => onModelChange(model.id)}
											disabled={isGenerating}
											className={cn(
												"h-10 px-2 gap-2 justify-start transition-all border border-border/40 rounded-md",
												isSelected && activeClasses,
											)}
											data-testid={`edit-model-button-${model.id}`}
										>
											{model.logo ? (
												<Image
													src={model.logo}
													alt={`${model.displayName} logo`}
													width={28}
													height={28}
													className={cn(
														"transition-all flex-shrink-0",
														isMonochrome && "dark:invert",
														!isSelected && "opacity-60",
													)}
												/>
											) : null}
											<span
												className={cn(
													"text-xs font-medium truncate",
													isSelected &&
														"text-emerald-700 dark:text-emerald-400",
												)}
											>
												{model.displayName}
											</span>
										</Button>
									</TooltipTrigger>
									{model.description && (
										<RichTooltipContent className="max-w-[240px]">
											<p className="font-semibold text-sm tracking-tight">
												{model.displayName}
											</p>
											<p className="text-sm text-muted-foreground mt-1 leading-relaxed">
												{model.description}
											</p>
										</RichTooltipContent>
									)}
								</Tooltip>
							);
						})}
					</div>
				</fieldset>
			</div>

			{/* Footer with actions */}
			<div className="p-4 border-t border-border/50 bg-background/50">
				<div className="flex gap-2">
					<Button
						variant="ghost"
						onClick={onClose}
						disabled={isGenerating}
						className="flex-1"
					>
						Cancel
					</Button>
					<Button onClick={onSubmit} disabled={!canSubmit} className="flex-1">
						{isGenerating ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Generating...
							</>
						) : (
							"Generate"
						)}
					</Button>
				</div>
				<p className="text-xs text-muted-foreground text-center mt-2">
					Press ⌘/Ctrl+Enter to generate
				</p>
			</div>
		</>
	);

	// Docked mode: render without backdrop, with different positioning
	if (isDocked) {
		return (
			<AnimatePresence>
				{isOpen && (
					<motion.div
						initial={{ opacity: 0, x: 20 }}
						animate={{ opacity: 1, x: 0 }}
						exit={{ opacity: 0, x: 20 }}
						transition={{ type: "spring", damping: 25, stiffness: 300 }}
						className={cn(
							"h-full w-full",
							"bg-card/95 backdrop-blur-xl",
							"border-l border-border/50",
							"flex flex-col",
						)}
						onKeyDown={handleKeyDown}
					>
						{panelContent}
					</motion.div>
				)}
			</AnimatePresence>
		);
	}

	// Overlay mode: render with backdrop (original behavior)
	return (
		<AnimatePresence>
			{isOpen && (
				<>
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.15 }}
						className="absolute inset-0 bg-black/40 z-30"
						onClick={onClose}
					/>

					<motion.div
						initial={{ y: "100%", opacity: 0 }}
						animate={{ y: 0, opacity: 1 }}
						exit={{ y: "100%", opacity: 0 }}
						transition={{ type: "spring", damping: 25, stiffness: 300 }}
						className={cn(
							"absolute z-40",
							"bottom-0 left-0 right-0 md:bottom-auto md:top-0 md:left-auto md:right-0",
							"max-h-[70vh] md:max-h-full md:h-full md:w-[360px]",
							"bg-card/95 backdrop-blur-xl",
							"rounded-t-2xl md:rounded-t-none md:rounded-l-2xl",
							"border-t md:border-t-0 md:border-l border-border/50",
							"shadow-2xl",
							"flex flex-col",
						)}
						onClick={(e) => e.stopPropagation()}
						onKeyDown={handleKeyDown}
					>
						{panelContent}
					</motion.div>
				</>
			)}
		</AnimatePresence>
	);
}

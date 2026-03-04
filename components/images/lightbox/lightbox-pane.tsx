"use client";

import NextImage from "next/image";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import {
	type LightboxImage,
	useImageLightbox,
} from "@/hooks/use-image-lightbox";
import { cn } from "@/lib/utils";
import { LightboxPaneOverlay } from "./lightbox-pane-overlay";

export interface LightboxPaneProps {
	/** The image to display */
	image: LightboxImage;
	/** Label shown in corner badge (e.g., "Original", "Current") */
	label: string;
	/** Whether this pane is the currently selected version in the strip */
	isSelected?: boolean;
	/** Whether user is signed in (for auth-gating actions) */
	isSignedIn: boolean;
	/** Whether this pane can be edited (false for videos) */
	canEdit: boolean;
	/** Whether an edit is currently generating (shows blur + pulse overlay) */
	isGenerating?: boolean;
	/** Callback when user clicks Edit action */
	onEdit: (image: LightboxImage) => void;
	/** Callback when user clicks Save to Library */
	onSaveToLibrary: (prompt: string) => void;
	/** Callback when user clicks Copy Prompt */
	onCopyPrompt: (prompt: string) => void;
	/** Callback when backdrop (outside image) is clicked */
	onBackdropClick: () => void;
}

/**
 * Self-contained lightbox pane with independent zoom, hover state, and overlay.
 * Used in comparison view to display either the original or current image.
 */
export function LightboxPane({
	image,
	label,
	isSelected = false,
	isSignedIn,
	canEdit,
	isGenerating = false,
	onEdit,
	onSaveToLibrary,
	onCopyPrompt,
	onBackdropClick,
}: LightboxPaneProps) {
	// Each pane manages its own copy feedback state
	const [copied, setCopied] = React.useState(false);
	const copyTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(
		null,
	);

	// Clean up copy timeout on unmount
	React.useEffect(() => {
		return () => {
			if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
		};
	}, []);

	// Each pane manages its own hover state for overlay visibility
	const [isHoveringPane, setIsHoveringPane] = React.useState(false);

	// Use the lightbox hook for zoom and drag functionality
	const {
		isZoomed,
		naturalSize,
		isDragging,
		scrollContainerRef,
		canZoom,
		handleImageLoad,
		toggleZoom,
		handleMouseDown,
		handleMouseMove,
		handleMouseUp,
		handleMouseLeave,
		hasDragged: hasDraggedRef,
	} = useImageLightbox({ image, isOpen: true });

	// Image loading states for crossfade
	const [isThumbnailLoaded, setIsThumbnailLoaded] = React.useState(false);
	const [isFullResLoaded, setIsFullResLoaded] = React.useState(false);

	const thumbnailUrl = image.url;
	const fullResUrl = image.originalUrl || image.url;
	const hasSeparateThumbnail =
		!!image.originalUrl && image.originalUrl !== image.url;

	// Reset loading states when image changes
	// biome-ignore lint/correctness/useExhaustiveDependencies: reset on URL change is intentional
	React.useEffect(() => {
		setIsThumbnailLoaded(false);
		setIsFullResLoaded(false);
		// Also clear copy feedback from previous image
		if (copyTimeoutRef.current) {
			clearTimeout(copyTimeoutRef.current);
			copyTimeoutRef.current = null;
		}
		setCopied(false);
	}, [image.url, image.originalUrl]);

	// Handler for copy prompt action
	const handleCopyPrompt = React.useCallback(
		async (e: React.MouseEvent) => {
			e.stopPropagation();
			if (!image.prompt) return;
			await navigator.clipboard.writeText(image.prompt);
			onCopyPrompt(image.prompt);
			setCopied(true);
			if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
			copyTimeoutRef.current = setTimeout(() => {
				setCopied(false);
				copyTimeoutRef.current = null;
			}, 2000);
		},
		[image.prompt, onCopyPrompt],
	);

	// Handler for save to library action
	const handleSaveToLibrary = React.useCallback(() => {
		if (image.prompt) {
			onSaveToLibrary(image.prompt);
		}
	}, [image.prompt, onSaveToLibrary]);

	// Handler for edit action
	const handleEdit = React.useCallback(() => {
		onEdit(image);
	}, [image, onEdit]);

	// Clear drag state helper
	const clearDrag = React.useCallback(() => {
		hasDraggedRef.current = false;
	}, [hasDraggedRef]);

	// Show overlay when hovering pane and not zoomed
	const showOverlay = isHoveringPane && !isZoomed;

	// Measure the pane container so images can be reliably constrained.
	// CSS percentage-based max-height doesn't propagate through auto-height
	// intermediaries (button, group div), so we compute pixel bounds from the
	// pane element itself and pass them as inline max-width / max-height on the
	// images. This keeps the image aspect-ratio accurate while filling the pane.
	const [paneSize, setPaneSize] = React.useState<{
		width: number;
		height: number;
	} | null>(null);

	React.useEffect(() => {
		const el = scrollContainerRef.current;
		if (!el) return;

		const observer = new ResizeObserver((entries) => {
			for (const entry of entries) {
				const { width, height } = entry.contentRect;
				setPaneSize((prev) => {
					if (prev && prev.width === width && prev.height === height)
						return prev;
					return { width, height };
				});
			}
		});

		observer.observe(el);
		return () => observer.disconnect();
	}, [scrollContainerRef]);

	// Padding inside the pane (p-2 = 0.5rem × 2 = 1rem total each axis)
	const imageMaxWidth = paneSize ? paneSize.width - 16 : undefined;
	const imageMaxHeight = paneSize ? paneSize.height - 16 : undefined;

	const imageConstraintStyle: React.CSSProperties | undefined =
		!isZoomed && imageMaxWidth && imageMaxHeight
			? { maxWidth: imageMaxWidth, maxHeight: imageMaxHeight }
			: undefined;

	return (
		<div
			ref={scrollContainerRef}
			className={cn(
				"relative h-full w-full",
				isZoomed
					? cn(
							"overflow-auto flex",
							isDragging ? "cursor-grabbing" : "cursor-grab",
						)
					: "flex items-center justify-center overflow-hidden p-2",
			)}
			data-testid={`lightbox-pane-${label.toLowerCase()}`}
		>
			{/* Backdrop button for closing */}
			<button
				type="button"
				aria-label="Close lightbox"
				className="absolute inset-0 cursor-default"
				onClick={() => {
					if (hasDraggedRef.current) {
						clearDrag();
						return;
					}
					onBackdropClick();
				}}
				onKeyDown={(e) => {
					if (e.key === "Escape") {
						e.preventDefault();
						onBackdropClick();
					}
				}}
			/>

			{/* Label badge */}
			<Badge
				variant={isSelected ? "default" : "secondary"}
				className={cn(
					"absolute left-3 top-3 z-20 text-[10px] font-semibold uppercase tracking-widest backdrop-blur-sm border-white/10",
					isSelected
						? "bg-primary/80 text-white"
						: "bg-black/40 text-white/80 border-transparent",
				)}
			>
				{label}
			</Badge>

			{/* Image container with zoom support */}
			{/* biome-ignore lint/a11y/useSemanticElements: div is appropriate here for interactive container */}
			<div
				role="region"
				aria-label="Image preview"
				className="relative group/image"
				style={
					isZoomed
						? {
								width: naturalSize.width,
								height: naturalSize.height,
								flexShrink: 0,
								margin: "auto",
							}
						: imageConstraintStyle
				}
				onMouseEnter={() => setIsHoveringPane(true)}
				onMouseLeave={() => {
					handleMouseLeave();
					setIsHoveringPane(false);
				}}
			>
				{/* Clickable image area for zoom */}
				<button
					type="button"
					className={cn(
						"relative shadow-[0_0_50px_rgba(0,0,0,0.5)] z-10 rounded-sm block",
						!canZoom ? "cursor-default" : !isZoomed && "cursor-zoom-in",
					)}
					onClick={toggleZoom}
					onMouseDown={handleMouseDown}
					onMouseMove={handleMouseMove}
					onMouseUp={handleMouseUp}
					onKeyDown={(e) => {
						if (e.key === " ") {
							e.preventDefault();
						}
					}}
				>
					{/* Thumbnail (blurred placeholder) */}
					{hasSeparateThumbnail && thumbnailUrl && (
						<NextImage
							src={thumbnailUrl}
							alt={image.prompt || "Image"}
							onLoad={() => setIsThumbnailLoaded(true)}
							draggable={false}
							width={image.width || image.params?.width || 1000}
							height={image.height || image.params?.height || 1000}
							priority
							unoptimized={thumbnailUrl.startsWith("http")}
							style={imageConstraintStyle}
							className={cn(
								"h-auto w-auto select-none object-contain transition-all duration-500",
								!isThumbnailLoaded ? "opacity-0" : "opacity-100",
								isFullResLoaded
									? "opacity-0 pointer-events-none absolute inset-0"
									: "blur-[2px]",
							)}
						/>
					)}

					{/* Full resolution image */}
					<NextImage
						src={fullResUrl}
						alt={image.prompt || "Image"}
						onLoad={(e) => {
							handleImageLoad(e);
							setIsFullResLoaded(true);
						}}
						draggable={false}
						decoding="sync"
						width={image.width || image.params?.width || 1000}
						height={image.height || image.params?.height || 1000}
						priority
						unoptimized={fullResUrl.startsWith("http")}
						style={imageConstraintStyle}
						className={cn(
							"h-auto w-auto select-none object-contain transition-all duration-500",
							hasSeparateThumbnail
								? isFullResLoaded
									? "opacity-100"
									: "opacity-0"
								: !isFullResLoaded
									? "opacity-0"
									: "opacity-100",
							isGenerating && "blur-md",
						)}
					/>

					{/* Generating overlay with pulse effect */}
					{isGenerating && (
						<div className="absolute inset-0 z-20 rounded-sm overflow-hidden pointer-events-none">
							<div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse" />
							<div
								className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
								style={{
									animation: "shimmer 2s ease-in-out infinite",
								}}
							/>
						</div>
					)}
				</button>

				{/* Pane overlay with metadata and actions - sibling to button to avoid nesting */}
				<LightboxPaneOverlay
					image={image}
					isVisible={showOverlay}
					isSignedIn={isSignedIn}
					canEdit={canEdit}
					copied={copied}
					onEdit={handleEdit}
					onSaveToLibrary={handleSaveToLibrary}
					onCopyPrompt={handleCopyPrompt}
					onHoverChange={setIsHoveringPane}
				/>
			</div>

			{/* Loading spinner */}
			{!isThumbnailLoaded && !isFullResLoaded && (
				<div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
					<Spinner className="h-8 w-8 text-white/50" />
				</div>
			)}
		</div>
	);
}

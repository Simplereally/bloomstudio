"use client";

import { Loader2, ZoomIn } from "lucide-react";
import NextImage from "next/image";
import * as React from "react";
import { isVideoContent, MediaPlayer } from "@/components/ui/media-player";
import {
	type LightboxImage,
	useImageLightbox,
} from "@/hooks/use-image-lightbox";
import { cn } from "@/lib/utils";

const readyImageUrls = new Set<string>();

export function markLightboxImageUrlReady(url: string | undefined) {
	if (!url) {
		return;
	}

	readyImageUrls.add(url);
}

function isImageUrlReady(url: string | undefined) {
	if (!url) {
		return false;
	}

	return readyImageUrls.has(url);
}

export interface LightboxMediaDisplayProps {
	image: LightboxImage;
	isOpen: boolean;
	isLoadingDetails: boolean;
	onHoverChange: (isHovering: boolean) => void;
	onBackdropClick: () => void;
	/** Callback fired when zoom state changes */
	onZoomChange?: (isZoomed: boolean) => void;
	/** Whether an edit is currently generating (shows blur + pulse overlay) */
	isGenerating?: boolean;
}

export function LightboxMediaDisplay({
	image,
	isOpen,
	isLoadingDetails: _isLoadingDetails,
	onHoverChange,
	onBackdropClick,
	onZoomChange,
	isGenerating = false,
}: LightboxMediaDisplayProps) {
	const isVideo = isVideoContent(image.contentType, image.url);

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
		setIsHovering,
	} = useImageLightbox({ image, isOpen });

	// Notify parent of zoom state changes
	// Use a ref for the callback to avoid re-running the effect when the callback identity changes
	const onZoomChangeRef = React.useRef(onZoomChange);
	React.useEffect(() => {
		onZoomChangeRef.current = onZoomChange;
	}, [onZoomChange]);

	React.useEffect(() => {
		onZoomChangeRef.current?.(isZoomed);
	}, [isZoomed]);

	const [isThumbnailLoaded, setIsThumbnailLoaded] = React.useState(false);
	const [isFullResLoaded, setIsFullResLoaded] = React.useState(false);

	const thumbnailUrl = image.url;
	const fullResUrl = image.originalUrl || image.url;
	const hasSeparateThumbnail =
		image.originalUrl && image.originalUrl !== image.url;

	React.useEffect(() => {
		setIsThumbnailLoaded(isImageUrlReady(thumbnailUrl));
		setIsFullResLoaded(isImageUrlReady(fullResUrl));
	}, [fullResUrl, thumbnailUrl]);

	const handleHoverChange = React.useCallback(
		(hovering: boolean) => {
			setIsHovering(hovering);
			onHoverChange(hovering);
		},
		[setIsHovering, onHoverChange],
	);

	const handleContainerClick = React.useCallback(
		(e: React.MouseEvent | React.KeyboardEvent) => {
			if ("button" in e && hasDraggedRef.current) {
				hasDraggedRef.current = false;
				return;
			}
			if (e.target === e.currentTarget) {
				onBackdropClick();
			}
		},
		[hasDraggedRef, onBackdropClick],
	);

	const handleKeyDown = React.useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === "Escape") {
				onBackdropClick();
			}
		},
		[onBackdropClick],
	);

	return (
		<div
			ref={scrollContainerRef}
			role="button"
			tabIndex={0}
			className={cn(
				"w-full h-full",
				isZoomed
					? cn(
							"overflow-auto flex",
							isDragging ? "cursor-grabbing" : "cursor-grab",
						)
					: "flex items-center justify-center overflow-hidden",
			)}
			onMouseDown={handleMouseDown}
			onMouseMove={handleMouseMove}
			onMouseUp={handleMouseUp}
			onMouseLeave={handleMouseLeave}
			onClick={handleContainerClick}
			onKeyDown={handleKeyDown}
		>
			<>
				{isVideo ? (
					<div
						role="presentation"
						className="relative"
						onClick={(e) => e.stopPropagation()}
						onKeyDown={(e) => e.stopPropagation()}
					>
						<div
							className="relative shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-sm group/video z-10"
							onMouseEnter={() => handleHoverChange(true)}
							onMouseLeave={() => handleHoverChange(false)}
						>
							<MediaPlayer
								url={image.url}
								alt={image.prompt || "Generated video"}
								contentType={image.contentType}
								controls={true}
								autoPlay={true}
								loop={true}
								muted={false}
								className="w-auto h-auto max-w-[100vw] max-h-[100vh] object-contain select-none"
								draggable={false}
							/>
						</div>
					</div>
				) : (
					<div
						role="presentation"
						className="relative"
						style={
							isZoomed
								? {
										width: naturalSize.width,
										height: naturalSize.height,
										flexShrink: 0,
										margin: "auto",
									}
								: undefined
						}
						onClick={(e) => e.stopPropagation()}
						onKeyDown={(e) => e.stopPropagation()}
					>
						<div
							role="button"
							tabIndex={0}
							className={cn(
								"relative shadow-[0_0_50px_rgba(0,0,0,0.5)] group/image z-10",
								!isZoomed && "rounded-sm",
								!canZoom ? "cursor-default" : !isZoomed && "cursor-zoom-in",
							)}
							onClick={toggleZoom}
							onKeyDown={(e) => {
								if (e.key === "Enter" || e.key === " ")
									toggleZoom(e as unknown as React.MouseEvent);
							}}
							onMouseEnter={() => handleHoverChange(true)}
							onMouseLeave={() => handleHoverChange(false)}
						>
							{hasSeparateThumbnail && thumbnailUrl && (
								<NextImage
									src={thumbnailUrl}
									alt={image.prompt || "Generated image"}
									onLoad={() => {
										markLightboxImageUrlReady(thumbnailUrl);
										setIsThumbnailLoaded(true);
									}}
									draggable={false}
									width={image.width || image.params?.width || 1000}
									height={image.height || image.params?.height || 1000}
									priority
									unoptimized={thumbnailUrl.startsWith("http")}
									className={cn(
										"w-auto h-auto object-contain select-none transition-all duration-500",
										isZoomed
											? ""
											: "max-w-[calc(100vw-2rem)] max-h-[calc(100vh-6rem)] md:max-w-[calc(100vw-6rem)] md:max-h-[calc(100vh-8rem)]",
										!isThumbnailLoaded ? "opacity-0" : "opacity-100",
										isFullResLoaded
											? "opacity-0 pointer-events-none absolute inset-0"
											: "blur-[2px]",
									)}
								/>
							)}

							<NextImage
								src={fullResUrl || image.url}
								alt={image.prompt || "Generated image"}
								onLoad={(e) => {
									handleImageLoad(
										e as unknown as React.SyntheticEvent<HTMLImageElement>,
									);
									markLightboxImageUrlReady(fullResUrl || image.url);
									setIsFullResLoaded(true);
								}}
								draggable={false}
								decoding="sync"
								width={image.width || image.params?.width || 1000}
								height={image.height || image.params?.height || 1000}
								priority={true}
								unoptimized={(fullResUrl || image.url).startsWith("http")}
								className={cn(
									"w-auto h-auto object-contain select-none transition-all duration-500",
									isZoomed
										? ""
										: "max-w-[calc(100vw-2rem)] max-h-[calc(100vh-6rem)] md:max-w-[calc(100vw-6rem)] md:max-h-[calc(100vh-8rem)]",
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
						</div>

						{canZoom &&
							!isZoomed &&
							(isThumbnailLoaded || isFullResLoaded) && (
								<div className="absolute top-4 right-4 z-10 opacity-0 group-hover/image:opacity-100 transition-opacity pointer-events-none">
									<div className="bg-black/40 backdrop-blur-md rounded-full p-2 border border-white/10 text-white/70">
										<ZoomIn className="w-5 h-5" />
									</div>
								</div>
							)}
					</div>
				)}
			</>

			{!isVideo && !isThumbnailLoaded && !isFullResLoaded && (
				<div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
					<Loader2 className="w-10 h-10 animate-spin text-white/50" />
				</div>
			)}
		</div>
	);
}

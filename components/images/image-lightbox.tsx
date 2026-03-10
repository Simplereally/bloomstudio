"use client";

import { useAuth } from "@clerk/nextjs";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import * as React from "react";
import { toast } from "sonner";
import { PromptLibrary } from "@/components/studio/features/prompt-library";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogTitle,
} from "@/components/ui/dialog";
import { isVideoContent, MediaPlayer } from "@/components/ui/media-player";
import type { Id } from "@/convex/_generated/dataModel";
import { useImageDetails } from "@/hooks/queries/use-image-history";
import { useImageEdit } from "@/hooks/use-image-edit";
import {
	type LightboxImage,
	useImageLightbox,
} from "@/hooks/use-image-lightbox";
import { useVerticalSwipeNavigation } from "@/hooks/use-vertical-swipe-navigation";
import { getModelConstraints } from "@/lib/config/models";
import type { GeneratedImage } from "@/lib/schemas/pollinations.schema";
import {
	EditImagePanel,
	LightboxActions,
	LightboxCompareView,
	LightboxInfoOverlay,
	LightboxMediaDisplay,
	LightboxVersionStrip,
	type SourceImageDisplayInfo,
} from "./lightbox";

export type { LightboxImage };

interface ImageLightboxProps {
	image: LightboxImage | null;
	isOpen: boolean;
	onClose: () => void;
	mediaNavigation?: {
		hasNext: boolean;
		hasPrevious: boolean;
		hideVideoControls?: boolean;
		onNext: () => void;
		onPrevious: () => void;
	};
	/** Optional callback when a prompt is inserted from the library (used to update prompt input) */
	onInsertPrompt?: (content: string) => void;
}

export function ImageLightbox({
	image,
	isOpen,
	onClose,
	mediaNavigation,
	onInsertPrompt,
}: ImageLightboxProps) {
	// Fetch full image details if we only have thumbnail data (no prompt)
	// This happens when opening from gallery which now returns lightweight data
	const imageId = image?._id as Id<"generatedImages"> | undefined;
	const needsFullData = image && !image.prompt && imageId;
	const fullImageData = useImageDetails(needsFullData ? imageId : null);

	// Merge thumbnail data with full data when available
	const displayImage: LightboxImage | null = React.useMemo(() => {
		if (!image) return null;

		return {
			...image,
			// Use full data if available, otherwise fall back to what we have
			url: fullImageData?.url ?? image.url,
			prompt: fullImageData?.prompt ?? image.prompt ?? "",
			model: fullImageData?.model ?? image.model,
			width: fullImageData?.width ?? image.width,
			height: fullImageData?.height ?? image.height,
			seed: fullImageData?.seed ?? image.seed,
			contentType: fullImageData?.contentType ?? image.contentType,
			params:
				image.params ??
				(fullImageData
					? {
							model: fullImageData.model,
							width: fullImageData.width,
							height: fullImageData.height,
							seed: fullImageData.seed,
						}
					: undefined),
		};
	}, [image, fullImageData]);

	const isVideo = displayImage
		? isVideoContent(displayImage.contentType, displayImage.url)
		: false;

	const isLoadingDetails = !!needsFullData && fullImageData === undefined;

	const [editChain, setEditChain] = React.useState<LightboxImage[]>([]);
	const [selectedVersionIndex, setSelectedVersionIndex] = React.useState(0);

	// Track which image is the source for an edit (from pane click)
	const [editSourceImage, setEditSourceImage] =
		React.useState<LightboxImage | null>(null);

	// Track which label the source image had (for display in edit panel)
	const [editSourceLabel, setEditSourceLabel] = React.useState<string>("");

	const versions = React.useMemo(() => {
		if (!displayImage) return [] as LightboxImage[];
		return [displayImage, ...editChain];
	}, [displayImage, editChain]);

	const hasEdits = editChain.length > 0;
	const selectedImage = versions[selectedVersionIndex] ?? displayImage;
	const activeImage = selectedImage ?? displayImage;
	const imageSessionKey =
		image?._id ?? image?.id ?? image?.originalUrl ?? image?.url ?? null;

	// Zoom state for single-image mode (updated via callback from LightboxMediaDisplay)
	const [singleModeZoomed, setSingleModeZoomed] = React.useState(false);
	const suppressBackdropClickUntilRef = React.useRef(0);
	const suppressBackdropClick = React.useCallback(() => {
		suppressBackdropClickUntilRef.current = Date.now() + 180;
	}, []);
	const resetEditSessionState = React.useCallback(() => {
		setEditChain([]);
		setSelectedVersionIndex(0);
		setSingleModeZoomed(false);
		setEditSourceImage(null);
		setEditSourceLabel("");
	}, []);

	React.useEffect(() => {
		// Reset local-only edit state whenever the opened image changes.
		suppressBackdropClickUntilRef.current = 0;
		resetEditSessionState();
	}, [imageSessionKey, resetEditSessionState]);

	React.useEffect(() => {
		if (!isOpen) {
			suppressBackdropClickUntilRef.current = 0;
			resetEditSessionState();
		}
	}, [isOpen, resetEditSessionState]);

	const { copied, handleCopyPrompt, isHovering, setIsHovering } =
		useImageLightbox({ image: selectedImage, isOpen });

	// Use the appropriate zoom state based on view mode
	// In comparison mode, each pane manages its own zoom, so we use false for parent
	const isZoomed = hasEdits ? false : singleModeZoomed;

	// Auth state for gating features
	const { isSignedIn } = useAuth();

	const canEditImage = !isVideo && !!selectedImage?.url;
	const {
		isEditPanelOpen,
		openEditPanel,
		closeEditPanel,
		editPrompt,
		setEditPrompt,
		selectedModel,
		setSelectedModel,
		isGenerating,
		submitEdit,
		reset: resetEdit,
		editModels,
		canSubmit,
		// New aspect ratio and resolution state
		selectedAspectRatio,
		setSelectedAspectRatio,
		selectedResolutionTier,
		setSelectedResolutionTier,
		outputWidth,
		outputHeight,
		sourceFormatInfo,
		availableAspectRatios,
		initializeFromSource,
	} = useImageEdit({
		onSuccess: (newImage: GeneratedImage) => {
			setEditChain((prev) => {
				const thumbnail = newImage.thumbnailUrl ?? newImage.url;
				const nextVersion: LightboxImage = {
					url: thumbnail,
					originalUrl: newImage.url,
					prompt: newImage.prompt,
					model: newImage.params.model,
					width: newImage.params.width,
					height: newImage.params.height,
					seed: newImage.params.seed,
					params: {
						model: newImage.params.model,
						width: newImage.params.width,
						height: newImage.params.height,
						seed: newImage.params.seed,
					},
					id: newImage.id,
					_id: newImage._id,
					contentType: newImage.contentType,
				};

				const next = [...prev, nextVersion];
				setSelectedVersionIndex(next.length);
				return next;
			});
			setEditSourceImage(null);
			setEditSourceLabel("");
			toast.success("Edit generated");
		},
		onError: (error) => {
			toast.error(error.message || "Failed to generate edit");
		},
	});

	// Get model constraints for the selected model
	const modelConstraints = React.useMemo(
		() => getModelConstraints(selectedModel),
		[selectedModel],
	);

	// Prompt library state for saving prompts
	const [libraryOpen, setLibraryOpen] = React.useState(false);
	const [saveContent, setSaveContent] = React.useState<string | undefined>(
		undefined,
	);

	// Confirmation dialog state for closing with unsaved edits
	const [showCloseConfirm, setShowCloseConfirm] = React.useState(false);

	/** Handle close attempt - shows confirmation if there are edits */
	const handleCloseAttempt = React.useCallback(() => {
		if (hasEdits) {
			setShowCloseConfirm(true);
		} else {
			onClose();
		}
	}, [hasEdits, onClose]);

	const handleDialogOpenChange = React.useCallback(
		(open: boolean) => {
			if (!open) {
				handleCloseAttempt();
			}
		},
		[handleCloseAttempt],
	);

	/** Confirm close - actually closes the lightbox */
	const handleConfirmClose = React.useCallback(() => {
		setShowCloseConfirm(false);
		onClose();
	}, [onClose]);

	const handleBackdropCloseAttempt = React.useCallback(() => {
		if (Date.now() < suppressBackdropClickUntilRef.current) {
			return;
		}

		handleCloseAttempt();
	}, [handleCloseAttempt]);

	const handleLightboxSurfaceClick = React.useCallback(
		(event: React.MouseEvent<HTMLDivElement>) => {
			if (event.target === event.currentTarget) {
				handleBackdropCloseAttempt();
			}
		},
		[handleBackdropCloseAttempt],
	);

	// ==========================================
	// Pane action handlers (used in compare mode)
	// ==========================================

	/** Called when Edit is clicked on a pane - stores the source image and opens edit panel */
	const handlePaneEdit = React.useCallback(
		(sourceImage: LightboxImage) => {
			setEditSourceImage(sourceImage);

			// Determine which label this image had
			const isOriginal =
				sourceImage.url === displayImage?.url &&
				sourceImage.originalUrl === displayImage?.originalUrl;
			setEditSourceLabel(isOriginal ? "Original" : "Current");

			// Initialize aspect ratio and resolution from source dimensions
			const width = sourceImage.width ?? sourceImage.params?.width ?? 1024;
			const height = sourceImage.height ?? sourceImage.params?.height ?? 1024;

			initializeFromSource({
				url: sourceImage.originalUrl || sourceImage.url,
				width,
				height,
				label: isOriginal ? "Original" : "Current",
			});

			openEditPanel();
		},
		[displayImage, initializeFromSource, openEditPanel],
	);

	/** Called when Edit is clicked in single image mode */
	const handleSingleImageEdit = React.useCallback(() => {
		if (!activeImage) return;

		// Initialize from the active image dimensions
		const width = activeImage.width ?? activeImage.params?.width ?? 1024;
		const height = activeImage.height ?? activeImage.params?.height ?? 1024;

		initializeFromSource({
			url: activeImage.originalUrl || activeImage.url,
			width,
			height,
		});

		openEditPanel();
	}, [activeImage, initializeFromSource, openEditPanel]);

	/** Called when Save to Library is clicked on a pane */
	const handlePaneSaveToLibrary = React.useCallback((prompt: string) => {
		if (prompt) {
			setSaveContent(prompt);
			setLibraryOpen(true);
		}
	}, []);

	/** Noop: each pane handles clipboard copy + feedback internally */
	const handlePaneCopyPrompt = React.useCallback((_prompt: string) => {
		// Intentional no-op — pane already copies to clipboard and manages its own feedback
	}, []);

	/** Submit edit using the tracked source image (or fall back to activeImage) */
	const handleSubmitEdit = React.useCallback(() => {
		const sourceImage = editSourceImage ?? activeImage;
		if (!sourceImage) return;
		const sourceUrl = sourceImage.originalUrl || sourceImage.url;
		if (sourceUrl) {
			submitEdit(sourceUrl);
		}
	}, [editSourceImage, activeImage, submitEdit]);

	/** Close edit panel and clear source tracking */
	const handleCloseEditPanel = React.useCallback(() => {
		closeEditPanel();
		setEditSourceImage(null);
		setEditSourceLabel("");
	}, [closeEditPanel]);

	// Build source image display info for the edit panel
	const sourceImageDisplayInfo: SourceImageDisplayInfo | undefined =
		React.useMemo(() => {
			const source = editSourceImage || activeImage;
			if (!source) return undefined;

			return {
				url: source.originalUrl || source.url,
				thumbnailUrl: source.url,
				label: editSourceLabel || undefined,
				formatInfo: sourceFormatInfo,
			};
		}, [editSourceImage, activeImage, editSourceLabel, sourceFormatInfo]);

	// Render function for the docked edit panel (used in compare mode)
	const renderDockedEditPanel = React.useCallback(() => {
		return (
			<EditImagePanel
				isOpen={isEditPanelOpen}
				onClose={handleCloseEditPanel}
				editPrompt={editPrompt}
				onEditPromptChange={setEditPrompt}
				selectedModel={selectedModel}
				onModelChange={setSelectedModel}
				models={editModels.map((m) => ({
					id: m.id,
					displayName: m.displayName,
					logo: m.logo,
					description: m.description,
				}))}
				isGenerating={isGenerating}
				canSubmit={canSubmit}
				onSubmit={handleSubmitEdit}
				sourceImage={sourceImageDisplayInfo}
				selectedAspectRatio={selectedAspectRatio}
				onAspectRatioChange={setSelectedAspectRatio}
				availableAspectRatios={availableAspectRatios}
				selectedResolutionTier={selectedResolutionTier}
				onResolutionTierChange={setSelectedResolutionTier}
				modelConstraints={modelConstraints}
				outputWidth={outputWidth}
				outputHeight={outputHeight}
				isDocked
			/>
		);
	}, [
		isEditPanelOpen,
		handleCloseEditPanel,
		editPrompt,
		setEditPrompt,
		selectedModel,
		setSelectedModel,
		editModels,
		isGenerating,
		canSubmit,
		handleSubmitEdit,
		sourceImageDisplayInfo,
		selectedAspectRatio,
		setSelectedAspectRatio,
		availableAspectRatios,
		selectedResolutionTier,
		setSelectedResolutionTier,
		modelConstraints,
		outputWidth,
		outputHeight,
	]);

	const isSwipeNavigationEnabled =
		isOpen &&
		!hasEdits &&
		!isZoomed &&
		!isEditPanelOpen &&
		Boolean(mediaNavigation) &&
		(mediaNavigation?.hasNext === true || mediaNavigation?.hasPrevious === true);

	const swipeNavigationHandlers = useVerticalSwipeNavigation({
		enabled: isSwipeNavigationEnabled,
		itemKey: imageSessionKey ? String(imageSessionKey) : null,
		onSwipeIntent: suppressBackdropClick,
		onSwipeUp: mediaNavigation?.hasNext
			? () => {
				suppressBackdropClick();
				mediaNavigation.onNext();
			}
			: undefined,
		onSwipeDown: mediaNavigation?.hasPrevious
			? () => {
				suppressBackdropClick();
				mediaNavigation.onPrevious();
			}
			: undefined,
	});
	const {
		touchAction: swipeTouchAction,
		overlayStyle: swipeOverlayStyle,
		mediaStyle: swipeMediaStyle,
		isDragging: isSwipeDragging,
		isAnimating: isSwipeAnimating,
		...swipeGestureHandlers
	} = swipeNavigationHandlers;
	const isSwipeInteractionActive = isSwipeDragging || isSwipeAnimating;
	const showMobileSwipeVideoControls = mediaNavigation?.hideVideoControls !== true;
	const lightboxBackdropStyle = isSwipeNavigationEnabled
		? swipeOverlayStyle
		: { backgroundColor: "rgba(0, 0, 0, 0.8)" };
	const lightboxSwipeRegionProps = isSwipeNavigationEnabled
		? {
				"data-testid": "lightbox-swipe-region",
				style: { touchAction: swipeTouchAction as React.CSSProperties["touchAction"] },
				...swipeGestureHandlers,
			}
		: {};

	return (
		<>
			<Dialog open={isOpen} onOpenChange={handleDialogOpenChange}>
				<DialogContent
					className="!fixed !inset-0 !flex !items-center !justify-center !border-none !bg-transparent !p-0 !shadow-none !w-screen !h-screen !max-w-none !translate-x-0 !translate-y-0 !outline-none !duration-75"
					showCloseButton={false}
					onOpenAutoFocus={(e) => e.preventDefault()}
				>
					<VisuallyHidden>
						<DialogTitle>Fullscreen Preview</DialogTitle>
						<DialogDescription>
							Previewing image: {displayImage?.prompt}
						</DialogDescription>
					</VisuallyHidden>

					{displayImage && activeImage && (
						<div
							className="w-full h-full backdrop-blur-md cursor-default flex items-center justify-center animate-in fade-in duration-150"
							style={lightboxBackdropStyle}
						>
							<div
								className="relative w-full h-full"
								data-testid="lightbox-surface"
								onClick={handleLightboxSurfaceClick}
								{...lightboxSwipeRegionProps}
							>
								{isVideo ? (
									<div className="relative w-full h-full">
										<button
											type="button"
											aria-label="Close lightbox"
											className="absolute inset-0 cursor-default"
											onClick={handleBackdropCloseAttempt}
											onMouseEnter={() => setIsHovering(true)}
											onMouseLeave={() => setIsHovering(false)}
											onFocus={() => setIsHovering(true)}
											onBlur={() => setIsHovering(false)}
										/>
										<div
											className="relative w-full h-full flex items-center justify-center p-4"
											style={swipeMediaStyle}
											data-testid="lightbox-swipe-motion"
										>
											<div className="relative shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-sm group/video z-10">
												<MediaPlayer
													key={displayImage.url}
													url={displayImage.url}
													alt={displayImage.prompt || "Generated video"}
													contentType={displayImage.contentType}
													controls={showMobileSwipeVideoControls}
													autoPlay={true}
													loop={true}
													muted={true}
													className="w-auto h-auto max-w-full max-h-full object-contain select-none"
													draggable={false}
												/>
											</div>
										</div>
									</div>
								) : hasEdits ? (
									<div
										className="w-full h-full transition-all duration-300 pb-36 md:pb-40"
									>
										<LightboxCompareView
											key={imageSessionKey ?? displayImage.url}
											baseImage={displayImage}
											selectedImage={activeImage}
											isSignedIn={!!isSignedIn}
											canEdit={canEditImage}
											isGenerating={isGenerating}
											onEdit={handlePaneEdit}
											onSaveToLibrary={handlePaneSaveToLibrary}
											onCopyPrompt={handlePaneCopyPrompt}
											onBackdropClick={handleCloseAttempt}
											isEditPanelOpen={isEditPanelOpen}
											renderEditPanel={renderDockedEditPanel}
										/>
									</div>
								) : (
									<div className="w-full h-full">
										<div
											className="w-full h-full"
											style={swipeMediaStyle}
											data-testid="lightbox-swipe-motion"
										>
											<LightboxMediaDisplay
												image={activeImage}
												isOpen={isOpen}
												isLoadingDetails={isLoadingDetails}
												isGenerating={isGenerating}
												onHoverChange={setIsHovering}
												onBackdropClick={handleBackdropCloseAttempt}
												onZoomChange={setSingleModeZoomed}
											/>
										</div>
									</div>
								)}

								{/* Bottom hover zone to trigger overlay (only in single mode) */}
								{!hasEdits && !isZoomed && !isSwipeInteractionActive && (
									<button
										type="button"
										aria-hidden="true"
										tabIndex={-1}
										className="absolute bottom-0 inset-x-0 h-[15vh] min-h-[150px] z-[5] cursor-default"
										onMouseEnter={() => setIsHovering(true)}
										onMouseLeave={() => setIsHovering(false)}
										onClick={(e) => e.preventDefault()}
									/>
								)}

								{/* Global info overlay - only shown in single image mode */}
								{/* In comparison mode, each pane has its own overlay */}
								{!hasEdits && (
									<LightboxInfoOverlay
										image={activeImage}
										isLoadingDetails={isLoadingDetails}
										isVisible={!isZoomed && isHovering && !isSwipeInteractionActive}
										onHoverChange={setIsHovering}
										footer={
											<LightboxVersionStrip
												versions={versions}
												selectedIndex={selectedVersionIndex}
												onSelect={(index) => {
													setSelectedVersionIndex(index);
													resetEdit();
												}}
											/>
										}
									>
										<LightboxActions
											isSignedIn={!!isSignedIn}
											isLoadingDetails={isLoadingDetails}
											hasPrompt={!!activeImage.prompt}
											copied={copied}
											onCopyPrompt={handleCopyPrompt}
											onOpenSaveToLibrary={() => {
												if (activeImage.prompt) {
													setSaveContent(activeImage.prompt);
													setLibraryOpen(true);
												}
											}}
											onOpenEdit={handleSingleImageEdit}
											canEdit={canEditImage}
										/>
									</LightboxInfoOverlay>
								)}

								{/* Version strip for comparison mode - shown at bottom separately */}
								{hasEdits && (
									<div className="absolute bottom-0 inset-x-0 z-20 pb-6 pt-12 px-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none">
										<div className="pointer-events-auto max-w-[1400px] mx-auto w-full">
											<LightboxVersionStrip
												versions={versions}
												selectedIndex={selectedVersionIndex}
												onSelect={(index) => {
													setSelectedVersionIndex(index);
													resetEdit();
												}}
											/>
										</div>
									</div>
								)}

								{/* Edit panel for single image mode (overlay) and mobile compare mode */}
								{/* On desktop compare mode, the panel is rendered docked inside LightboxCompareView */}
								{!hasEdits && (
									<EditImagePanel
										isOpen={isEditPanelOpen}
										onClose={handleCloseEditPanel}
										editPrompt={editPrompt}
										onEditPromptChange={setEditPrompt}
										selectedModel={selectedModel}
										onModelChange={setSelectedModel}
										models={editModels.map((m) => ({
											id: m.id,
											displayName: m.displayName,
											logo: m.logo,
											description: m.description,
										}))}
										isGenerating={isGenerating}
										canSubmit={canSubmit}
										onSubmit={handleSubmitEdit}
										sourceImage={sourceImageDisplayInfo}
										selectedAspectRatio={selectedAspectRatio}
										onAspectRatioChange={setSelectedAspectRatio}
										availableAspectRatios={availableAspectRatios}
										selectedResolutionTier={selectedResolutionTier}
										onResolutionTierChange={setSelectedResolutionTier}
										modelConstraints={modelConstraints}
										outputWidth={outputWidth}
										outputHeight={outputHeight}
									/>
								)}

								{/* Mobile edit panel for compare mode (bottom sheet overlay) */}
								{hasEdits && (
									<div className="md:hidden">
										<EditImagePanel
											isOpen={isEditPanelOpen}
											onClose={handleCloseEditPanel}
											editPrompt={editPrompt}
											onEditPromptChange={setEditPrompt}
											selectedModel={selectedModel}
											onModelChange={setSelectedModel}
											models={editModels.map((m) => ({
												id: m.id,
												displayName: m.displayName,
												logo: m.logo,
												description: m.description,
											}))}
											isGenerating={isGenerating}
											canSubmit={canSubmit}
											onSubmit={handleSubmitEdit}
											sourceImage={sourceImageDisplayInfo}
											selectedAspectRatio={selectedAspectRatio}
											onAspectRatioChange={setSelectedAspectRatio}
											availableAspectRatios={availableAspectRatios}
											selectedResolutionTier={selectedResolutionTier}
											onResolutionTierChange={setSelectedResolutionTier}
											modelConstraints={modelConstraints}
											outputWidth={outputWidth}
											outputHeight={outputHeight}
										/>
									</div>
								)}
							</div>
						</div>
					)}
				</DialogContent>
			</Dialog>

			{/* Prompt Library Modal - rendered as independent sibling so lightbox persists */}
			<PromptLibrary
				isOpen={libraryOpen}
				onClose={() => {
					setLibraryOpen(false);
					setSaveContent(undefined);
				}}
				promptType="positive"
				onInsert={(content) => {
					// Call the external handler to insert the prompt into the textarea
					onInsertPrompt?.(content);
					setLibraryOpen(false);
				}}
				initialSaveContent={saveContent}
				onInsertComplete={onClose}
			/>

			{/* Confirmation dialog for closing with edits */}
			<AlertDialog open={showCloseConfirm} onOpenChange={setShowCloseConfirm}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Leave editing session?</AlertDialogTitle>
						<AlertDialogDescription>
							You have edited versions of this image. The comparison view will
							no longer be available once you close. Your generated images are
							already saved to your gallery.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Continue Editing</AlertDialogCancel>
						<AlertDialogAction onClick={handleConfirmClose}>
							Close Preview
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}

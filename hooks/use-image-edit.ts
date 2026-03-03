"use client";

import * as React from "react";
import {
	type ServerGenerationError,
	useGenerateImage,
} from "@/hooks/queries/use-generate-image";
import {
	getModel,
	getModelAspectRatios,
	getModelConstraints,
	MODEL_REGISTRY,
	type ModelDefinition,
} from "@/lib/config/models";
import {
	getDefaultTierForModel,
	getSupportedTiersForModel,
} from "@/lib/config/resolution-tiers";
import { getStandardDimensionsWithFallback } from "@/lib/config/standard-resolutions";
import type {
	GeneratedImage,
	ImageGenerationParams,
} from "@/lib/schemas/pollinations.schema";
import {
	detectImageFormat,
	type ImageFormatInfo,
} from "@/lib/utils/detect-image-format";
import type {
	AspectRatio,
	AspectRatioOption,
	ResolutionTier,
} from "@/types/pollinations";

const EDIT_CAPABLE_MODELS = Object.values(MODEL_REGISTRY).filter(
	(model): model is ModelDefinition =>
		model.supportsReferenceImage === true && model.type === "image",
);

const DEFAULT_EDIT_MODEL = "kontext";

export interface UseImageEditOptions {
	onSuccess: (newImage: GeneratedImage) => void;
	onError: (error: ServerGenerationError) => void;
}

export interface SourceImageInfo {
	url: string;
	width: number;
	height: number;
	label?: string; // "Original" or "Current" for display
}

export interface UseImageEditReturn {
	isEditPanelOpen: boolean;
	openEditPanel: () => void;
	closeEditPanel: () => void;

	editPrompt: string;
	setEditPrompt: (prompt: string) => void;
	selectedModel: string;
	setSelectedModel: (model: string) => void;

	// Aspect ratio and resolution state
	selectedAspectRatio: AspectRatio;
	setSelectedAspectRatio: (ratio: AspectRatio) => void;
	selectedResolutionTier: ResolutionTier;
	setSelectedResolutionTier: (tier: ResolutionTier) => void;
	outputWidth: number;
	outputHeight: number;

	// Source image info (for display)
	sourceImageInfo: SourceImageInfo | null;
	sourceFormatInfo: ImageFormatInfo | null;

	// Available options based on selected model
	availableAspectRatios: readonly AspectRatioOption[];
	availableResolutionTiers: readonly ResolutionTier[];

	isGenerating: boolean;
	error: ServerGenerationError | null;

	submitEdit: (sourceImageUrl: string) => void;
	cancelGeneration: () => void;
	reset: () => void;

	// Initialize from source image dimensions
	initializeFromSource: (info: SourceImageInfo) => void;

	editModels: readonly ModelDefinition[];
	canSubmit: boolean;
}

export function useImageEdit({
	onSuccess,
	onError,
}: UseImageEditOptions): UseImageEditReturn {
	const [isEditPanelOpen, setIsEditPanelOpen] = React.useState(false);
	const [editPrompt, setEditPrompt] = React.useState("");
	const [selectedModel, setSelectedModel] = React.useState(DEFAULT_EDIT_MODEL);

	// Source image tracking
	const [sourceImageInfo, setSourceImageInfo] =
		React.useState<SourceImageInfo | null>(null);

	// Aspect ratio and resolution state
	const [selectedAspectRatio, setSelectedAspectRatio] =
		React.useState<AspectRatio>("1:1");
	const [selectedResolutionTier, setSelectedResolutionTier] =
		React.useState<ResolutionTier>("hd");
	const [outputWidth, setOutputWidth] = React.useState(1024);
	const [outputHeight, setOutputHeight] = React.useState(1024);

	// Computed source format info
	const sourceFormatInfo = React.useMemo(() => {
		if (!sourceImageInfo) return null;
		return detectImageFormat(sourceImageInfo.width, sourceImageInfo.height);
	}, [sourceImageInfo]);

	// Get available options based on selected model
	const availableAspectRatios = React.useMemo(() => {
		return getModelAspectRatios(selectedModel) ?? [];
	}, [selectedModel]);

	const availableResolutionTiers = React.useMemo(() => {
		const constraints = getModelConstraints(selectedModel);
		if (!constraints) return ["hd"] as const;
		return getSupportedTiersForModel(constraints);
	}, [selectedModel]);

	// Update dimensions when ratio or tier changes
	const updateDimensions = React.useCallback(
		(ratio: AspectRatio, tier: ResolutionTier) => {
			const dims = getStandardDimensionsWithFallback(ratio, tier);
			setOutputWidth(dims.width);
			setOutputHeight(dims.height);
		},
		[],
	);

	// Handle aspect ratio change
	const handleAspectRatioChange = React.useCallback(
		(ratio: AspectRatio) => {
			setSelectedAspectRatio(ratio);
			updateDimensions(ratio, selectedResolutionTier);
		},
		[selectedResolutionTier, updateDimensions],
	);

	// Handle resolution tier change
	const handleResolutionTierChange = React.useCallback(
		(tier: ResolutionTier) => {
			setSelectedResolutionTier(tier);
			updateDimensions(selectedAspectRatio, tier);
		},
		[selectedAspectRatio, updateDimensions],
	);

	// Handle model change - may need to adjust ratio/tier if not supported
	const handleModelChange = React.useCallback(
		(model: string) => {
			setSelectedModel(model);

			const modelDef = getModel(model);
			if (!modelDef) return;

			const ratios = getModelAspectRatios(model) ?? [];
			const constraints = getModelConstraints(model);
			const supportedTiers = constraints
				? getSupportedTiersForModel(constraints)
				: (["hd"] as const);

			// Check if current aspect ratio is supported
			const ratioSupported = ratios.some(
				(r) => r.value === selectedAspectRatio,
			);
			let newRatio = selectedAspectRatio;
			if (!ratioSupported && ratios.length > 0) {
				// Try to find a similar ratio, or default to first available
				newRatio = ratios[0].value;
				setSelectedAspectRatio(newRatio);
			}

			// Check if current tier is supported
			let newTier = selectedResolutionTier;
			if (!supportedTiers.includes(selectedResolutionTier)) {
				newTier = constraints ? getDefaultTierForModel(constraints) : "hd";
				setSelectedResolutionTier(newTier);
			}

			// Update dimensions
			updateDimensions(newRatio, newTier);
		},
		[selectedAspectRatio, selectedResolutionTier, updateDimensions],
	);

	// Initialize from source image
	const initializeFromSource = React.useCallback(
		(info: SourceImageInfo) => {
			setSourceImageInfo(info);

			// Detect format from source dimensions
			const format = detectImageFormat(info.width, info.height);

			// Get model constraints to validate
			const constraints = getModelConstraints(selectedModel);
			const ratios = getModelAspectRatios(selectedModel) ?? [];
			const supportedTiers = constraints
				? getSupportedTiersForModel(constraints)
				: (["hd"] as const);

			// Use detected ratio if supported, otherwise default to first available
			let ratio = format.aspectRatio;
			const ratioSupported = ratios.some((r) => r.value === ratio);
			if (!ratioSupported && ratios.length > 0) {
				ratio = ratios[0].value;
			}

			// Use detected tier if supported, otherwise use default
			let tier = format.resolutionTier;
			if (!supportedTiers.includes(tier)) {
				tier = constraints ? getDefaultTierForModel(constraints) : "hd";
			}

			setSelectedAspectRatio(ratio);
			setSelectedResolutionTier(tier);
			updateDimensions(ratio, tier);
		},
		[selectedModel, updateDimensions],
	);

	const {
		generate,
		isGenerating,
		error,
		cancelCurrentGeneration,
		reset: resetGeneration,
	} = useGenerateImage({
		onSuccess: (image) => {
			onSuccess(image);
			setIsEditPanelOpen(false);
			setEditPrompt("");
		},
		onError: (err) => {
			onError(err);
		},
	});

	const openEditPanel = React.useCallback(() => {
		setIsEditPanelOpen(true);
	}, []);

	const closeEditPanel = React.useCallback(() => {
		setIsEditPanelOpen(false);
		setEditPrompt("");
		setSourceImageInfo(null);
	}, []);

	const submitEdit = React.useCallback(
		(sourceImageUrl: string) => {
			if (!editPrompt.trim() || !sourceImageUrl) return;

			const params: ImageGenerationParams = {
				prompt: editPrompt.trim(),
				model: selectedModel,
				image: sourceImageUrl,
				width: outputWidth,
				height: outputHeight,
			};

			generate(params);
		},
		[editPrompt, selectedModel, outputWidth, outputHeight, generate],
	);

	const cancelGeneration = React.useCallback(() => {
		void cancelCurrentGeneration();
		resetGeneration();
	}, [cancelCurrentGeneration, resetGeneration]);

	const reset = React.useCallback(() => {
		setIsEditPanelOpen(false);
		setEditPrompt("");
		setSourceImageInfo(null);
		setSelectedAspectRatio("1:1");
		setSelectedResolutionTier("hd");
		setOutputWidth(1024);
		setOutputHeight(1024);
		resetGeneration();
	}, [resetGeneration]);

	const canSubmit = editPrompt.trim().length > 0 && !isGenerating;

	return {
		isEditPanelOpen,
		openEditPanel,
		closeEditPanel,

		editPrompt,
		setEditPrompt,
		selectedModel,
		setSelectedModel: handleModelChange,

		// Aspect ratio and resolution
		selectedAspectRatio,
		setSelectedAspectRatio: handleAspectRatioChange,
		selectedResolutionTier,
		setSelectedResolutionTier: handleResolutionTierChange,
		outputWidth,
		outputHeight,

		// Source info
		sourceImageInfo,
		sourceFormatInfo,

		// Available options
		availableAspectRatios,
		availableResolutionTiers,

		isGenerating,
		error,

		submitEdit,
		cancelGeneration,
		reset,
		initializeFromSource,

		editModels: EDIT_CAPABLE_MODELS,
		canSubmit,
	};
}

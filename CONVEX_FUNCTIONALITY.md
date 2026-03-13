# Convex Functionality Documentation

This document provides an exhaustive overview of all Convex functions and files remaining in the codebase after the migration of heavy image/video generation compute to Cloudflare.

## Overview

After migrating heavy compute tasks to Cloudflare, Convex now serves as the primary data store, authentication layer, and orchestration system. The remaining Convex functionality focuses on:

- **User Management & Authentication**
- **Data Persistence & Metadata Storage**
- **Content Moderation & Analysis**
- **Social Features (Favorites, Follows)**
- **Subscription & Billing Management**
- **Rate Limiting & System Maintenance**
- **Cloudflare Worker Dispatch & Orchestration**

---

## Core Database Schema (`schema.ts`)

**Purpose**: Defines all database tables and their relationships. This is the foundation of the entire data model.

**Key Tables**:
- `users` - User profiles with encrypted API keys
- `generatedImages` - AI-generated image metadata with moderation status
- `generatedImageDetails` - Heavy fields split for performance optimization
- `pendingGenerations` - Async single generation tracking
- `batchJobs`/`batchItems` - Batch generation management
- `referenceImages` - User-uploaded reference images
- `favorites` - User favorited images
- `follows` - User social relationships
- `prompts`/`userPromptLibrary` - Shared prompt management
- `rateLimits` - API rate limiting
- `providerHealth` - External provider status tracking
- `musicGenerations` - AI-generated music tracks

---

## User Management & Authentication

### `auth.config.ts`
**Purpose**: Clerk JWT authentication configuration for Convex.
- Configures JWT issuer domain from Clerk "convex" template
- Enables secure authentication between frontend and Convex

### `users.ts`
**Purpose**: User profile management and API key storage.
- `getOrCreateUser` - Creates or updates user records from Clerk identity
- `getCurrentUser` - Retrieves current authenticated user
- `updateApiKey` - Stores encrypted Pollinations API keys
- `getApiKey` - Retrieves decrypted API keys for BYOP flow
- `updateContentFilterPreference` - Manages sensitive content settings
- `updateDefaultPrivate` - Controls default generation visibility

### `usernameGenerator.ts`
**Purpose**: Generates random usernames for new users.
- Creates privacy-preserving usernames when users first sign up

---

## Image Generation Orchestration

### `singleGeneration.ts`
**Purpose**: Manages single image generation lifecycle with Cloudflare dispatch.
- `startGeneration` - Creates pending generation record and dispatches to Cloudflare
- `getGeneration` - Retrieves generation status and metadata
- `getActiveGenerations` - Gets user's in-progress generations
- `cancelGeneration` - Cancels pending generations
- `storeGeneratedImage` - Stores completed image metadata from Cloudflare
- `cleanupStuckGenerations` - Recovers from orphaned generation records

### `batchGeneration.ts`
**Purpose**: Handles batch image generation with chunked Cloudflare dispatch.
- `startBatchJob` - Creates batch job and schedules first chunk
- `getBatchJob` - Retrieves batch job status and progress
- `getActiveBatchJobs` - Gets user's active batch jobs
- `pauseBatchJob`/`resumeBatchJob`/`cancelBatchJob` - Batch lifecycle management
- `storeBatchItemImage` - Stores individual batch item results
- `processBatchQueue` - Internal queue processor for chunked dispatch

---

## Cloudflare Worker Integration

### `cloudflareDispatch.ts`
**Purpose**: Dispatches generation jobs to Cloudflare workers with retry logic.
- `dispatchSingleGeneration` - Sends single generation jobs to workers
- `dispatchBatchItem` - Sends batch item jobs to workers
- `dispatchPromptInference` - Sends content analysis jobs
- `dispatchVisionAnalysis` - Sends image analysis jobs
- `dispatchSecondaryAssets` - Sends video derivative processing jobs

### `cloudflareWorkerHttp.ts`
**Purpose**: HTTP endpoints for Cloudflare worker callbacks.
- `claimSingleGeneration` - Worker claim endpoint for single generations
- `completeSingleGeneration` - Worker completion callback
- `failSingleGeneration` - Worker failure callback
- `claimBatchItem`/`completeBatchItem`/`failBatchItem` - Batch item lifecycle
- `updatePromptInference`/`updateVisionAnalysis` - Content analysis callbacks
- `updateSecondaryAssets` - Video derivative processing callbacks

---

## Content Moderation & Analysis

### `contentAnalysis.ts`
**Purpose**: Coordinates AI-powered content moderation and analysis.
- `analyzeRecentImages` - Catches up on unanalyzed images
- `dispatchPromptInference` - Sends prompts for AI analysis
- `dispatchVisionAnalysis` - Sends images for visual analysis
- `handlePromptInferenceResult` - Processes prompt analysis results
- `handleVisionAnalysisResult` - Processes visual analysis results
- `analyzeUnanalyzedImages` - Recovery mechanism for stuck analysis

### `lib/nsfwDetection.ts`
**Purpose**: Client-side NSFW keyword detection for immediate feedback.
- `analyzePromptForNSFW` - Basic keyword-based content filtering
- Provides instant feedback before server-side analysis

### `lib/promptInference.ts`
**Purpose**: AI-powered prompt analysis using external providers.
- `analyzePromptWithAI` - Sends prompts to Groq/OpenRouter for analysis
- Handles provider health and rate limiting

### `lib/visionAnalysis.ts`
**Purpose**: AI-powered image content analysis.
- `analyzeImageWithAI` - Sends images to vision analysis providers
- Detects nudity, violence, and other sensitive content

---

## Social Features

### `favorites.ts`
**Purpose**: User favorite image management.
- `toggle` - Adds/removes images from favorites
- `isFavorited` - Checks favorite status
- `list` - Paginated user favorites
- `batchIsFavorited` - Efficient batch favorite status checks

### `follows.ts`
**Purpose**: User social relationship management.
- `follow`/`unfollow` - Manage user relationships
- `isFollowing` - Check follow status
- `getFollowStats` - Get follower/following counts

---

## Subscription & Billing

### `stripe.ts`
**Purpose**: Stripe subscription management and checkout.
- `createSubscriptionCheckout` - Creates Stripe checkout sessions
- `getSubscriptionStatus` - Retrieves user subscription status
- `manageBillingUrl` - Creates Stripe customer portal links

### `lib/subscription.ts`
**Purpose**: Subscription logic and trial management.
- `hasActiveSubscription` - Checks for active Pro subscription
- `isInTrialPeriod` - Checks 24-hour trial eligibility
- `canUserGenerate` - Validates generation permissions
- `getSubscriptionStatus` - Gets detailed subscription status

### `lib/stripeHelpers.ts`
**Purpose**: Stripe SDK utilities and error handling.
- `createStripeClient` - Configures Stripe client
- `getStripeErrorMessage` - Normalizes Stripe errors
- `resolvePriceForPlan` - Dynamic price resolution via lookup keys

---

## Prompt Library

### `promptLibrary.ts`
**Purpose**: Shared prompt management and discovery.
- `searchPrompts` - Full-text search across all prompts
- `savePromptToLibrary` - Saves prompts with deduplication
- `removePromptFromLibrary` - Removes prompts from user library
- `getUserLibrary` - Gets user's saved prompts
- `isInLibrary` - Checks if prompt is saved

---

## Reference Images

### `referenceImages.ts`
**Purpose**: User-uploaded reference image management for image-to-image generation.
- `create` - Stores new reference image metadata
- `getById` - Retrieves specific reference image (owner only)
- `getMyImages` - Paginated user reference images
- `remove` - Deletes reference image record
- `getByR2Key` - Deduplication check by R2 storage key
- `getRecent` - Gets recent reference images (limited)

---

## Music Generation

### `musicGenerations.ts`
**Purpose**: AI-generated music track persistence and reactions.
- `create` - Stores new music generation records
- `setReaction` - Manages like/dislike reactions
- `updateTitle` - Updates track titles
- `listByOwner` - Lists user's music generations with filtering

---

## Rate Limiting

### `rateLimits.ts`
**Purpose**: Sliding window rate limiting for API endpoints.
- `checkRateLimit` - Consumes rate limit quota
- `getRateLimitStatus` - Checks remaining quota without consuming
- `cleanupExpiredLimits` - Removes expired rate limit records

---

## System Maintenance & Cleanup

### `crons.ts`
**Purpose**: Scheduled maintenance tasks.
- Hourly rate limit cleanup
- Daily orphaned R2 object cleanup
- 5-minute stuck generation cleanup
- Hourly content analysis recovery

### `orphanCleanup.ts`
**Purpose**: Identifies and cleans up orphaned R2 storage objects.
- `auditOrphanedObjects` - Scans for objects without Convex records
- `cleanupOrphanedObjects` - Deletes confirmed orphaned objects
- Prevents storage bloat from failed operations

### `admin.ts`
**Purpose**: Development-only admin utilities.
- `grantProByEmail` - Grants synthetic Pro subscriptions (dev only)
- `revokeProByEmail` - Revokes dev-granted subscriptions
- Internal mutations - not exposed to public API

---

## Utility Libraries

### `lib/crypto.ts`
**Purpose**: AES-256-GCM encryption for API key storage.
- `encryptApiKey`/`decryptApiKey` - Secure API key handling
- Web Crypto API implementation (Convex V8 runtime compatible)

### `lib/batchGenerationState.ts`
**Purpose**: Batch generation state management logic.
- `getBatchStatusAfterItemSettlement` - Determines batch status
- `getResumeBatchDecision` - Batch resumption logic

### `lib/providerHealth.ts`
**Purpose**: External provider availability tracking.
- Monitors rate limits for Groq/OpenRouter
- Prevents wasteful API calls during rate limit periods

### `lib/retry.ts`
**Purpose**: Retry logic with exponential backoff.
- `calculateRetryDelay` - Smart retry timing
- Handles transient failures gracefully

### `lib/pollinations.ts`
**Purpose**: Pollinations API client for image generation.
- `generateImage` - Main generation API client
- `checkGenerationStatus` - Status polling
- Model-specific parameter handling
- Error handling and retry logic

### `lib/groq.ts`
**Purpose**: Groq LLM API client for prompt analysis.
- `analyzePrompt` - Prompt content analysis
- Rate limit handling and error parsing
- Provider health integration

### `lib/openrouter.ts`
**Purpose**: OpenRouter LLM API client for prompt analysis.
- `analyzePrompt` - Alternative prompt analysis provider
- Provider fallback support
- Rate limit and error handling

---

## HTTP Routes & Webhooks

### `http.ts`
**Purpose**: Central HTTP route registry for all Convex HTTP endpoints.
- **Stripe Webhooks**: Registers `/stripe/webhook` for subscription events
- **Cloudflare Worker Routes**: All worker callback endpoints for generation and moderation
- **Provider Health**: `/workers/provider-health/rate-limit` for rate limit reporting

### Stripe Integration Events:
- `customer.subscription.created/updated/deleted` - Subscription lifecycle
- `checkout.session.completed` - Payment completion
- `payment_intent.succeeded/failed` - Payment status
- `invoice.created/paid/failed` - Billing events

---

## Image Management

### `generatedImages.ts`
**Purpose**: Core AI-generated image CRUD operations with optimized queries.
- `create` - Creates new image records with initial NSFW analysis
- `getById` - Secure image retrieval with visibility checks
- `getMyImages` - Optimized gallery thumbnails with filtering (visibility, models)
- `getMyImagesWithDisplayData` - History page with full display info (no generationParams)
- `getPublicFeed` - Public feed with content filtering and bandwidth optimization
- `getImagesByUsername` - User-specific public galleries
- `getFollowingFeed` - Social feed from followed users (optimized per-user queries)
- `setVisibility` - Visibility updates with NSFW analysis for private→public transitions

**Optimization Features**:
- Lightweight thumbnail format for gallery (90% bandwidth reduction)
- Public feed optimization with owner enrichment
- Advanced indexing strategy for multi-dimensional filtering
- Content-sensitive feed filtering (block/blur/allow)

---

## Secondary Assets (Video Derivatives)

### `secondaryAssets.ts`
**Purpose**: Video thumbnail and preview generation lifecycle management.
- `updateSecondaryAssets` - Stores thumbnail/preview URLs from workers
- `markSecondaryAssetsDispatched` - Dispatch state management with retry tracking
- `claimSecondaryAssetsForWorker` - Worker claim mechanism with duplicate prevention
- `getSecondaryAssetsWorkerContinuationState` - Worker resume capability
- `completeSecondaryAssetsFromWorker` - Completion handling with duplicate detection
- `failSecondaryAssetsFromWorker` - Failure handling with error storage

---

## System Utilities & Diagnostics

### `system_check.ts`
**Purpose**: Development and maintenance utilities.
- `getSystemTime` - Server time verification
- `forceCleanupAllStuck` - Manual cleanup of stuck generations (15+ minutes)

### `troubleshoot_v2.ts`
**Purpose**: Advanced troubleshooting and user diagnostics.
- `verifyUserAndGenerations` - Complete user state analysis with similar user detection
- `diagnoseCronCleanup` - Cron job visibility and stuck generation diagnostics
- `forceCleanStuckGenerations` - User-specific stuck generation cleanup

### `tempTagStats.ts`
**Purpose**: NSFW tagging progress and statistics.
- `getTaggingStatus` - Efficient tagging completion statistics
- Performance-optimized queries with indexed lookups
- Legacy record detection and counting

### `detailsMigration.ts`
**Purpose**: P0 optimization migration for table splitting.
**Status**: ✅ Complete for development, production deployment required
- Phase 1: Copy heavy fields to `generatedImageDetails` table
- Phase 2: Strip legacy fields from main records
- Preview functions for safe migration planning
- Batch processing to respect Convex limits

### `sensitivityMigration.ts`
**Purpose**: One-time sensitivity threshold adjustment.
- Migrates vision analysis results from 0.5 to 0.8 threshold
- Updates images incorrectly marked as sensitive
- Preview and batch processing capabilities

### `orphanCleanupQueries.ts`
**Purpose**: Data access patterns for orphan cleanup operations.
- `getAllR2Keys` - Collects all R2 storage keys from images and references
- Supports orphaned object detection and cleanup

---

## Utility Libraries

### `lib/dirtberryCrop.ts`
**Purpose**: Dirtberry model watermark removal processing.
- `isDirtberryModel` - Model detection
- `calculateDirtberryCropRegion` - 3% top/bottom trim calculation
- `cropDirtberryImageBuffer` - Jimp-based image processing (Convex compatible)
- Constants for source dimensions and trim fractions

### `lib/providerHealthFunctions.ts`
**Purpose**: Provider health management API functions.
- `checkProvidersAvailable` - Availability status
- `getHealth`/`getAllHealth` - Health status queries
- `recordRateLimit`/`recordRateLimitWithReset` - Rate limit tracking
- `markAvailable` - Manual provider reset
- `refreshExpiredLimits` - Automatic limit expiration
- `resetAllProviders` - Debug utilities

### `lib/cloudflareWorkerHttp.ts`
**Purpose**: Internal HTTP client for Cloudflare communication.
- HTTP utilities for worker dispatch and callbacks
- Error handling and retry logic
- Response parsing and validation

---

## Configuration

### `convex.config.ts`
**Purpose**: Convex app configuration with middleware.
- Stripe component integration
- App middleware setup

### `README.md`
**Purpose**: Standard Convex development documentation.
- Function examples and patterns
- Basic usage instructions

---

## Migration Impact

### What Moved to Cloudflare:
- **Heavy Compute**: Actual image/video generation API calls
- **File Processing**: Media uploads to R2 storage
- **External API Calls**: Pollinations provider interactions
- **Long-running Operations**: Generation processing loops

### What Remains in Convex:
- **Data Persistence**: All metadata and user data
- **Authentication & Authorization**: User identity and permissions
- **Social Features**: Favorites, follows, user interactions
- **Content Moderation**: Analysis coordination and results storage
- **Business Logic**: Subscription management, rate limiting
- **Orchestration**: Job dispatch and lifecycle management
- **System Maintenance**: Cleanup tasks and health monitoring

### Architecture Benefits:
- **Cost Efficiency**: Heavy compute moved to cheaper Cloudflare workers
- **Performance**: Convex focused on fast data operations
- **Reliability**: Separate failure domains for compute vs data
- **Scalability**: Independent scaling of compute and storage layers

---

## Key Patterns

### BYOP (Bring Your Own Pollen) Flow:
1. Client retrieves encrypted API key from Convex
2. Client sends API key with generation request
3. Convex stores API key securely for worker use
4. Cloudflare worker uses stored API key for generation
5. Results flow back through Convex for persistence

### Dispatch Pattern:
1. Convex creates job record with "pending" dispatch status
2. Internal action dispatches job to Cloudflare worker
3. Worker claims job via HTTP callback
4. Worker processes and reports completion/failure
5. Convex updates final status and stores results

### Content Moderation Flow:
1. Initial prompt analysis during generation
2. Vision analysis after image generation
3. Results stored in image metadata
4. User preferences control content display

---

This documentation reflects the current state of Convex functionality after the Cloudflare migration, focusing on its role as the data and orchestration layer rather than heavy compute processing.

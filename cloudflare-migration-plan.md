# Cloudflare Worker Plane Migration Plan

Status: In Progress (Release-ready; migration complete and remaining work is smoke/monitoring only)
Date: 2026-03-12
Owner: Bloom Studio

## Decision

Bloom Studio should keep Convex as the control plane and move heavy background execution to Cloudflare.

Target split:
- Convex: auth, durable job state, reactive UI queries, lightweight scheduling, quotas, ownership checks, final persistence.
- Cloudflare Workers + Queues: provider calls, long external waits, retry/backoff, queueing, worker concurrency.
- Secondary video asset processing now lives on the worker plane, and the active implementation targets Cloudflare Media Transformations rather than in-worker video decode.

This is the lowest-cost architecture that preserves the existing UX:
- users can queue many generations quickly
- jobs continue after refresh/close/reconnect
- completed results flow back into the UI reactively

## Why This Decision

The current scaling bottleneck is not Convex as a state layer. The bottleneck is using Convex Node actions for heavy, wait-heavy worker execution.

That is the wrong cost surface for this workload because:
- generation and moderation are dominated by external I/O waits
- video post-processing is heavy Node compute
- Convex action compute is too expensive for long-running worker behavior

Cloudflare is the preferred worker plane because:
- it is a much smaller migration than replacing Convex
- it preserves the current reactive UI model
- Workers are a better fit for I/O-heavy external API calls
- Queues provide a durable dispatch primitive
- the operational surface is still relatively small

## Cost Posture

This plan is optimized for the lowest sensible ongoing cost, not for staying fully on free tiers at all costs.

Recommended starting point:
- Convex remains on the current plan until post-migration metrics prove otherwise.
- Cloudflare Workers should be treated as a paid service from the start.
- Docker/Containers are not part of the active migration path.

Practical interpretation:
- the realistic target is "small fixed monthly cost with large compute savings"
- not "zero dollars forever"
- that is still materially better than continuing to burn Convex action compute on worker workloads

## Alternatives Rejected

### Full Supabase replacement
- Fixes the wrong problem.
- Requires replacing a working reactive state model.
- Large migration surface with little benefit outside worker cost.

### Full Upstash / QStash replacement
- Too much backend rewrite.
- Worse data model for job state and querying.
- Lower-confidence long-term scaling shape.

### Inngest-first
- Strong orchestration tool, but over-scoped for the current problem.
- Adds another service before worker economics are fixed.

### Existing Hetzner worker plane
- Valid as a stopgap.
- Rejected as the primary path because Cloudflare is easier to operate, scale, and reason about long term.
- Can still be used as an emergency fallback if Cloudflare setup stalls.

## Architectural Principles

### 1. Convex remains the source of truth
- The UI should continue to derive state from Convex queries.
- No client polling of Cloudflare or providers.
- No client dependency on in-memory job state.

### 2. Convex should not wait on providers
- No long provider requests in Convex Node actions.
- No ffmpeg or other heavy post-processing in Convex.
- No retry sleeps or backoff waits in Convex actions.

### 3. External work must be replay-safe
- Every worker callback into Convex must be idempotent.
- Terminal state transitions must be guarded.
- Duplicate completion attempts must become no-ops.

### 4. Batch progress must be item-based, not doc-array-based
- Aggregate batch docs should stay small.
- Per-item progress should live in first-class rows.
- Do not keep growing hot arrays like `imageIds` or `settledItemIndexes` indefinitely on `batchJobs`.

### 5. Migrate the most expensive paths first
- Single generation worker path first.
- Batch item execution second.
- Moderation/content analysis third.
- Video secondary assets last, only if the remaining compute justifies moving them.

## Current Repo-Specific Bottlenecks

These functions were the primary candidates to leave Convex:
- `singleGenerationProcessor.processGenerationInternal` (removed after migration)
- `batchProcessor.processBatchItem` (removed after migration)
- `contentAnalysis.analyzeRecentImages`
- `contentAnalysis.analyzeImage`
- `promptInference.analyzePromptImage`

The main remaining candidate after the current migration slice was:
- `secondaryAssetsProcessor.processSecondaryAssets` (removed after migration)

Current schema concerns that should be corrected during migration:
- `pendingGenerations` needs dispatch and claim metadata.
- `batchJobs` is carrying both aggregate state and per-item progress.
- batch progress should move into a dedicated `batchItems` table.

## Target Architecture

### Control plane in Convex

Convex owns:
- job creation
- batch creation
- user authorization
- reactive queries for active jobs and completed results
- durable status transitions
- final image record persistence
- reconciliation of stuck jobs

Convex does not own:
- long provider requests
- external retry loops
- ffmpeg execution
- provider wait time

### Worker plane in Cloudflare

One Cloudflare project with one shared queue is the active design.

One codebase, one queue, multiple message types:
- `single_generation`
- `batch_item`
- `prompt_inference`
- `vision_analysis`

This keeps operations simpler and cheaper while preserving the option to split lanes later if foreground generation latency is affected.

### Worker-to-Convex communication

Workers should call Convex server-side using one of these patterns:
- `ConvexHttpClient` with server-side credentials
- HTTP actions secured with a shared secret

Use one pattern consistently. Do not mix both unless there is a clear need.

Required properties:
- authenticated server-to-server calls only
- idempotent finalize and fail mutations
- no direct client dependency on Cloudflare state

## Intent Durability

A separate outbox table is not required in the MVP.

Reason:
- Convex scheduling already gives durable intent when a mutation successfully commits and schedules the dispatcher.
- The first version can store dispatch metadata directly on the job row instead of introducing another table.

For the MVP, use row-level dispatch metadata on:
- `pendingGenerations`
- `batchItems`

An outbox table should only be added later if one of these becomes true:
- replay tooling becomes painful without a dedicated ledger
- dispatch debugging needs a generic audit trail
- multiple external worker systems are introduced

## Minimum Viable Migration

This is the smallest migration that meaningfully fixes cost.

### Phase 1: Introduce dispatch metadata and batch items

#### `pendingGenerations`
Add fields:
- `dispatchStatus`: `"pending" | "dispatched" | "processing" | "completed" | "failed" | "cancelled"`
- `dispatchAttempts`
- `dispatchedAt`
- `lastDispatchError`
- `claimToken`
- `workerAttempt`
- `providerRequestId` optional

Notes:
- `status` can remain as the UI-facing lifecycle field during migration.
- `dispatchStatus` is for worker-plane coordination and recovery.

#### `batchJobs`
Shrink responsibility to aggregate state only:
- owner
- batch status
- total count
- completed count
- failed count
- in-flight count
- createdAt
- updatedAt
- lastErrorCode optional

Fields to phase out from hot-path usage:
- `imageIds`
- `settledItemIndexes`
- `currentItemRetryCount`
- item-level retry tracking on the parent doc

#### New table: `batchItems`

Each item becomes its own row with fields similar to:
- `batchJobId`
- `ownerId`
- `itemIndex`
- `status`
- `generationParams` or normalized reference to shared params plus item overrides
- `dispatchStatus`
- `dispatchAttempts`
- `dispatchedAt`
- `lastDispatchError`
- `claimToken`
- `workerAttempt`
- `retryCount`
- `imageId`
- `errorMessage`
- `errorCode`
- `providerRequestId` optional
- `createdAt`
- `updatedAt`

Indexes should support:
- by batch + item index
- by batch + status
- by owner + active status
- by dispatch status + updatedAt for recovery sweeps

### Phase 2: Replace heavy Convex execution with tiny dispatchers

#### Single generation

`startGeneration` should:
- validate auth and entitlement
- insert the generation record
- set `dispatchStatus = "pending"`
- schedule a tiny dispatcher action or mutation-safe scheduled action

The Convex dispatcher should:
- read the generation
- no-op if already terminal or already dispatched
- mark `dispatchStatus = "dispatched"`
- publish a message to Cloudflare
- record `dispatchedAt`
- on failure, increment `dispatchAttempts` and store `lastDispatchError`

#### Batch generation

`startBatchJob` should:
- insert the parent batch row
- insert `batchItems` rows
- schedule a tiny dispatcher to seed the first set of items

The dispatcher should:
- choose dispatchable items
- respect batch pause/cancel state
- publish item messages to Cloudflare
- mark item `dispatchStatus = "dispatched"`

The parent batch doc should be updated from item completions, not used as the live queue itself.

### Phase 3: Build the Cloudflare worker plane

Cloudflare setup:
- one Worker project
- one shared config and secrets surface
- one shared queue carrying multiple job types

Generation worker responsibilities:
- receive generation or batch item message
- claim the job in Convex using a unique `claimToken`
- no-op if job is already terminal or claimed by a newer worker
- call the provider
- upload artifacts to R2
- call Convex finalize mutation
- on retryable failure, requeue with delay
- on terminal failure, call Convex fail mutation

Secondary asset worker responsibilities:
- fetch source video
- run thumbnail / preview generation
- upload artifacts
- patch the image record in Convex
- never change the main generation terminal state

Moderation worker responsibilities:
- claim moderation work in Convex
- run prompt inference and vision analysis externally
- record provider rate limits back into Convex
- finalize classification idempotently

## Callback and Idempotency Design

This is required in the MVP.

### Claim model

Before heavy work begins, the worker should call a Convex mutation that:
- verifies the job is dispatchable
- writes a fresh `claimToken`
- moves it to `processing`
- records `workerAttempt`
- records `updatedAt`

If the mutation returns `claimed = false`, the worker exits.

### Finalize model

The finalize mutation should:
- re-read the row
- no-op if already terminal
- no-op if `claimToken` does not match
- write final result fields
- transition to terminal state exactly once

### Fail model

The fail mutation should:
- no-op if already terminal
- no-op if `claimToken` does not match
- either requeue-eligible state transition or terminal failure
- record error metadata

### Reconciliation

Convex should keep lightweight sweeps for:
- `dispatchStatus = "pending"` too long
- `dispatchStatus = "dispatched"` too long
- `status = "processing"` too long

These sweepers should only re-dispatch or mark stale work after checking claim metadata and timestamps.

## Queue and Concurrency Strategy

Recommended rule:
- keep one shared queue unless batch or moderation traffic measurably harms foreground generation latency
- if that happens, split by workload class later for QoS, not for cost

## Cloudflare-Specific Notes

### Workers
- Use Workers for provider calls and queue consumers.
- Keep handlers small and deterministic.
- Use server-to-server Convex calls from Workers.

### Queues
- Use delayed retry via queue configuration or explicit requeue.
- Keep message payloads lightweight.
- Put only identifiers and routing metadata on the queue, not large payload blobs.

Suggested queue payload shape:
- `jobType`
- `jobId`
- `batchJobId` optional
- `batchItemId` optional
- `attempt`
- `enqueuedAt`

### Secondary Assets
- Do not force ffmpeg-heavy video post-processing into the current Worker path.
- Do not introduce Docker-based infrastructure as part of the active migration.
- Revisit this only after the main generation and batch compute savings are verified.

## Proposed Convex API Surface Changes

### New or changed mutations/actions
- `claimSingleGenerationForWorker`
- `finalizeSingleGenerationFromWorker`
- `failSingleGenerationFromWorker`
- `dispatchSingleGeneration`
- `dispatchPendingGenerationsSweep`
- `claimBatchItemForWorker`
- `finalizeBatchItemFromWorker`
- `failBatchItemFromWorker`
- `dispatchBatchItems`
- `dispatchPendingBatchItemsSweep`
- `claimModerationForWorker`
- `completePromptInferenceFromWorker`
- `failPromptInferenceFromWorker`
- `completeVisionAnalysisFromWorker`
- `failVisionAnalysisFromWorker`
- `dispatchPromptInference`
- `dispatchVisionAnalysis`
- `updateSecondaryAssetsFromWorker`

### Existing functions retired after cutover
- `singleGenerationProcessor.processGenerationInternal` (removed)
- `batchProcessor.processBatchItem` (removed)
- `secondaryAssetsProcessor.processSecondaryAssets` (removed)

### Existing functions to preserve
- UI-facing queries for active single generations
- UI-facing queries for active batch jobs
- image persistence mutations
- entitlement and ownership checks

## Batch Model Refactor

This is the most important schema correction in the migration.

### Current problem

`batchJobs` currently acts as:
- parent aggregate
- queue state
- per-item tracker
- retry ledger

That creates:
- hot document growth
- increasing write contention
- harder replay semantics
- poor long-term scaling

### Target model

Parent `batchJobs` row:
- aggregate only
- small and query-friendly

Child `batchItems` rows:
- one row per item
- own status, attempts, errors, image result, claim token

Parent updates should be derived from child terminal transitions.

## Rollout Order

### Phase 0: Cloudflare account setup

Human-run setup in the Cloudflare dashboard:
- select the correct Cloudflare account for Bloom Studio
- enable the Workers Paid plan
- enable Queues
- verify the existing R2 bucket that Bloom Studio already uses
- do not create any Docker/container infrastructure for this migration
- do not build a dashboard-only Worker yet if code will be deployed from this repo with Wrangler

Information to capture after Phase 0:
- Cloudflare account name
- confirmation that Workers Paid is active
- confirmation that Queues is enabled
- the exact R2 bucket name to reuse

### Step 1
Ship schema additions and no-op-compatible Convex mutations first.

### Step 2
Build the Cloudflare worker project and generation queue.

### Step 3
Cut over single generation to Cloudflare in development as the only active path.

### Step 4
Observe:
- Convex action compute
- Cloudflare queue success/failure
- stuck dispatch counts
- user-visible latency

### Step 5
Cut over batch item execution.

### Step 6
Cut over moderation/content analysis.

### Step 7
Evaluate whether secondary asset processing still needs to move.

## Rollback Plan

During development, prefer a hard cutover of the target path rather than a runtime feature flag.

Reason:
- the dev goal is to validate the real architecture, not carry two hot paths indefinitely
- runtime flags add branching complexity to a migration that is already cross-platform
- old Convex worker code can remain in the branch temporarily as a rollback target without being part of the live dev path

Development rollback behavior:
- restore the previous local branch state or revert the migration commit(s)
- redeploy the prior Convex and Worker code

Production rollback behavior:
- keep the previous production deployment artifacts available until the Cloudflare path is proven
- if rollback is required, redeploy the prior application/Convex state rather than adding a long-lived runtime switch

Do not remove old Convex worker code until:
- the Cloudflare path has run cleanly for at least one sustained usage window
- stuck job sweeps are verified
- retries and finalize paths are observed in development

## Observability and Success Metrics

### Convex
- action compute should drop sharply after single generation cutover
- long-running action duration should disappear from generation and moderation hot paths
- stuck `pending` / `processing` counts should stay near zero

### Cloudflare
- queue backlog depth
- consumer error rate
- retry volume
- worker callback failures into Convex
- per-lane latency

### Product
- user can click generate many times quickly
- jobs survive refresh and reconnect
- completed outputs still flow back into the UI without polling
- batch pause/cancel still behaves correctly

## Definition of Done

The migration is successful when all of the following are true:
- single generation no longer waits on providers inside Convex
- batch item execution no longer waits on providers inside Convex
- moderation/content analysis no longer waits on providers inside Convex
- video post-processing no longer runs inside Convex
- UI behavior is unchanged from the user perspective
- Convex remains the only source of truth for job state
- duplicate worker callbacks are safe
- parent batch docs are no longer used as per-item progress ledgers
- Convex action compute is no longer the scaling bottleneck for generation workloads

## Immediate Next Actions

1. Complete dev validation of the Cloudflare worker plane across single, batch, and moderation.
2. Decide whether secondary video assets are worth migrating off Convex.
3. If needed, implement a non-Docker secondary-assets worker path.
4. Do one final compute audit before promoting the worker plane toward production.

## Implementation Log

This section is the live implementation tracker for the migration. Update it as work lands.

### Decisions confirmed
- Convex remains the control plane.
- Cloudflare Workers + Queues is the worker plane.
- One shared queue should remain the default unless batch traffic demonstrably harms single-generation responsiveness.
- No separate outbox table in the MVP.
- `batchItems` will be introduced before batch migration.
- Development should validate the real single-generation Cloudflare path without a runtime feature flag.
- Docker/container infrastructure is explicitly out of scope for the active migration.

### Human setup completed
- [x] Cloudflare account selected and verified.
- [x] Workers Paid enabled.
- [x] Queues created:
  - `bloomstudio-prod-queue`
  - `bloomstudio-dev-queue`
  - `bloomstudio-prod-dlq`
  - `bloomstudio-dev-dlq`
- [x] R2 buckets confirmed:
  - prod: `bloomstudio-prod`
  - dev: `pixelstream-images`
- [x] Cloudflare Account ID captured.
- [x] Scoped API token created for Wrangler deployment.
- [x] Local Wrangler auth verified with:
  - `wrangler whoami`
  - `wrangler queues list`
  - `wrangler r2 bucket list`
- [x] Dev Worker scaffold deployed successfully.
- [x] `bloomstudio.fun` is now an active Cloudflare-managed zone.
- [x] `media.bloomstudio.fun` now exists as a Cloudflare Worker custom domain on `bloomstudio-worker` production.
- [x] A zone-scoped DNS token exists locally for `bloomstudio.fun`.
- [x] Cloudflare Media Transformations is enabled for `bloomstudio.fun`.
- [x] Cloudflare Media Transformations source origins allow:
  - `bloomstudio.fun`
  - `pub-26b39ecf46a949a3ad2ca8830b2c6fee.r2.dev`
  - `pub-bb5851ee4cc640979680ac710a0dd683.r2.dev`
- [x] `media.bloomstudio.fun` now resolves to the Cloudflare worker edge instead of Vercel.

### Repo work completed
- [x] Replaced Browser Rendering video derivatives with Cloudflare Media Transformations URL generation in the shared Worker.
- [x] Removed the Browser Rendering binding and Puppeteer dependency from the Worker deployment surface.
- [x] Added `MEDIA_TRANSFORMS_BASE_URL` to Worker configuration.
- [x] Added Worker-side media-transform probes so thumbnail generation only completes when Cloudflare actually returns a valid image.
- [x] Added best-effort preview transform probing so preview failures degrade to original-video fallback instead of failing the whole secondary-assets job.
- [x] Updated gallery video thumbnail detection so Cloudflare media-transform still images render as images instead of mounting a `<video>` element.
- [x] Redeployed the dev Worker with the Media Transformations code path.
- [x] Validated the live Cloudflare Media Transformations URL shape against a real dev video:
  - thumbnail: `200 image/jpeg`
  - preview: `200 video/mp4`
- [x] Replayed a real failed dev `secondary_assets` row and confirmed it now settles as `completed` with both:
  - `thumbnailUrl`
  - `previewUrl`
- [x] Re-dispatched the remaining recent failed dev `secondary_assets` backlog rows and confirmed they also settled as `completed`.
- [x] Manual smoke validation confirmed:
  - images generate correctly
  - videos generate correctly
  - single generation behaves correctly
  - batch generation behaves correctly
  - transformed thumbnails render correctly in the UI
- Added initial Cloudflare Worker scaffolding:
  - `wrangler.jsonc`
  - `workers/bloomstudio-worker/src/index.ts`
  - local Worker env example
  - Worker package scripts
- Added single-generation worker-plane metadata to `pendingGenerations`:
  - `dispatchStatus`
  - `dispatchAttempts`
  - `dispatchedAt`
  - `lastDispatchError`
  - `claimToken`
  - `workerAttempt`
  - `providerRequestId`
- Added `pendingGenerations.by_dispatch_status` index.
- Added worker-safe single-generation Convex primitives:
  - mark dispatched
  - record dispatch failure
  - claim for worker
  - continuation-state lookup
  - complete from worker result
  - fail from worker
- Added Convex-to-Worker dispatch action:
  - `convex/cloudflareDispatch.ts`
- Added secured Worker callback HTTP actions:
  - `convex/cloudflareWorkerHttp.ts`
- Wired secured Worker callback routes into:
  - `convex/http.ts`
- Cut over single-generation start dispatch to:
  - `internal.cloudflareDispatch.dispatchSingleGeneration`
- Implemented the first real Worker path for `single_generation`:
  - authenticated `/dispatch` ingress
  - queue enqueue + consume
  - retry-safe claim model
  - Pollinations provider call
  - R2 upload
  - exact-once completion/failure callbacks into Convex
- Added exact-once completion persistence in Convex:
  - `getGenerationWorkerContinuationState`
  - `completeGenerationFromWorkerResult`
- Verified the development single-generation cutover end to end:
  - live Convex backend pushed to dev
  - Worker `/dispatch` verified against the deployed secret
  - queue ingress confirmed after backend sync
  - `Queued` delay root cause identified as stale dev Convex backend, not queue throttling
- Synced local/deployed worker config:
  - `.dev.vars` now points at the dev Convex site
  - Wrangler observability config committed to repo
- Introduced `batchItems` as first-class execution state with indexes for:
  - batch + item lookup
  - batch + status
  - owner + status
  - dispatch status recovery
- Cut batch creation over to item-based dispatch:
  - `startBatchJob` now creates `batchItems`
  - batch seeding now dispatches chunks of up to 10 items at a time
  - subsequent chunks are scheduled 1.5s apart
- Added worker-safe batch Convex primitives:
  - mark batch item dispatched
  - record batch item dispatch failure
  - claim batch item for worker
  - batch item continuation-state lookup
  - complete batch item from worker result
  - fail batch item from worker
- Added secured batch Worker callback HTTP actions and routes.
- Extended the Cloudflare Worker to process `batch_item` queue messages.
- Deployed the updated dev Worker with both single-generation and batch-item consumers.
- Preserved per-item batch semantics:
  - item failures do not abort the rest of the batch
  - mixed-result batches still complete and return successful generations
  - pause blocks new chunk seeding but allows already-dispatched items to finish
  - resume restarts chunk seeding from the first remaining pending item
- Added moderation worker-plane metadata to `generatedImages`:
  - `moderationStage`
  - `moderationDispatchStatus`
  - `moderationDispatchAttempts`
  - `moderationDispatchedAt`
  - `moderationLastDispatchError`
  - `moderationClaimToken`
  - `moderationWorkerAttempt`
  - `moderationProviderRequestId`
  - `moderationUpdatedAt`
- Added moderation recovery/index support:
  - `generatedImages.by_moderation_dispatch_status`
  - recoverable unanalyzed-image query that skips already in-flight moderation work
- Replaced heavy Convex moderation execution with worker-safe coordination:
  - prompt inference now dispatches to Cloudflare instead of calling Cerebras in Convex
  - vision analysis recovery now dispatches to Cloudflare instead of calling providers in Convex
  - worker-safe claim/continue/complete/fail mutations now coordinate moderation state on `generatedImages`
- Added secured moderation Worker callback HTTP actions and routes for:
  - moderation claim/continue
  - prompt inference complete/fail
  - vision analysis complete/fail
  - provider rate-limit recording
- Extended the shared Cloudflare Worker to process:
  - `prompt_inference`
  - `vision_analysis`
- Preserved moderation semantics while changing execution plane:
  - prompt inference still decides safe/sensitive vs escalate-to-vision
  - prompt inference failures still fall through to vision
  - vision provider rate limits still update Convex provider-health state
  - failed vision attempts release back to pending recovery instead of burning queue retries indefinitely
- Verified live dev moderation behavior on fresh images:
  - safe prompts resolve through async prompt inference on the worker plane
  - clearly explicit prompts still short-circuit through the existing synchronous prompt-analysis gate
  - moderation remains non-blocking relative to generation completion
- Fixed backlog recovery bug in the Worker `/dispatch` endpoint:
  - historical moderation items with high `moderationDispatchAttempts` were being rejected as `Invalid dispatch attempt`
  - the Worker now accepts any positive dispatch attempt count so old pending items can recover
- Convex codegen and lint are passing for the migration slice.
- Focused generation/studio tests are passing, including the current batch hook/layout suite.

### Repo work in progress
- Development validation is now largely complete for the main generation paths:
  - single generation is running through the Cloudflare worker plane
  - batch generation is dispatching in chunks and behaving acceptably in dev
  - moderation now dispatches through the same shared queue and no longer spends Convex action time on external provider calls
  - secondary-assets dispatch for new worker-backed video completions now also routes through the Cloudflare worker plane instead of the Convex Node action
  - video secondary-assets now build Cloudflare Media Transformations URLs instead of attempting in-worker video decode
  - video secondary-assets now fail cleanly on the worker plane when Cloudflare media transforms are unavailable or misconfigured
  - recent dev secondary-assets backlog rows have been replayed successfully through the new path
  - observed completion ordering appears non-deterministic, which matches provider latency variance
  - legacy moderation backlog may still take time to drain, but fresh traffic is behaving correctly

### Remaining work
- [x] Replace Browser Rendering as the active video-derivative backend for production traffic.
- [x] Enable Media Transformations for `bloomstudio.fun` in the Cloudflare dashboard and allow the Bloom Studio R2 public hosts as source origins.
- [x] Re-run secondary-assets validation on real dev video traffic now that the zone-level Media Transformations path is live.
- [ ] Finish the last explicit edge-case validation cases for cancel, refresh/reconnect, and provider failure behavior.
- [ ] Let the old moderation backlog recover naturally, or run a targeted cleanup pass later if the stale `isSensitive = null` population remains materially large.
- [ ] Do a final compute/cost review after the secondary-assets migration lands and dev usage settles.
- [x] Remove the legacy Convex ffmpeg/processor path from the repo once worker-plane parity is in place.

## Handoff: Next Implementation Track

This section is the actionable handoff for the next developer. If you are picking this migration up, start here.

### Current truth
- [x] Single generation is migrated in dev.
- [x] Batch generation is migrated in dev.
- [x] Moderation is migrated in dev.
- [x] Secondary-assets dispatch for new worker-backed video completions is also migrated in dev.
- [x] The shared Worker now accepts `secondary_assets` queue messages and completes them through worker-safe Convex callbacks.
- [x] The shared Worker can now classify secondary-assets failures cleanly:
  - retryable load/timeout failures continue retrying
  - codec/runtime incompatibility fails terminally with an explicit error
- [x] New video records now carry secondary-assets worker state on `generatedImages`:
  - `secondaryAssetsDispatchStatus`
  - `secondaryAssetsDispatchAttempts`
  - `secondaryAssetsDispatchedAt`
  - `secondaryAssetsLastDispatchError`
  - `secondaryAssetsClaimToken`
  - `secondaryAssetsWorkerAttempt`
  - `secondaryAssetsUpdatedAt`
- [x] The active single/batch worker-complete paths no longer schedule the old Convex secondary-assets processor for new traffic.
- [x] The shared Worker now generates Cloudflare Media Transformations URLs for:
  - `thumbnailUrl`
  - `previewUrl` when the preview transform probe succeeds
- [x] The Cloudflare zone-level Media Transformations feature is enabled with the required source origins.
- [x] `media.bloomstudio.fun` is now serving from the Cloudflare worker edge instead of Vercel.
- [x] Manual smoke testing has confirmed the active path for:
  - image generation
  - video generation
  - single generation
  - batch generation
  - transformed thumbnails in the UI
- [x] The legacy Convex processor/runtime path for:
  - single generation
  - batch generation
  - secondary-assets ffmpeg work
  has been removed from the repo after parity validation.
- We are intentionally keeping:
  - Convex as the source of truth
  - one shared Cloudflare Worker codebase
  - one shared Cloudflare queue by default
  - cloud-hosted development resources (Convex dev cloud + Cloudflare dev resources) as the normal developer target
- We are intentionally avoiding:
  - Docker
  - container-based infrastructure
  - runtime feature flags for the dev path

### What secondary assets are
- They are post-generation derivatives for videos:
  - thumbnail image
  - compressed preview video
- They are non-blocking.
- They must never determine whether the main generation succeeds or fails.
- If secondary assets fail, the original video must still be usable in the UI.

### Current secondary-assets path
- Main generation completes in Convex and persists the video.
- Convex then schedules [cloudflareDispatch.ts](convex/cloudflareDispatch.ts) to enqueue a `secondary_assets` Worker message.
- The Worker claims the image through [cloudflareWorkerHttp.ts](convex/cloudflareWorkerHttp.ts) and finalizes through [secondaryAssets.ts](convex/secondaryAssets.ts).
- The currently deployed dev worker builds Cloudflare Media Transformations URLs against `https://media.bloomstudio.fun`.
- The Worker-owned patch contract keeps derivative fields optional:
  - `thumbnailR2Key`
  - `thumbnailUrl`
  - `previewR2Key`
  - `previewUrl`
- Current behavior intentionally preserves graceful fallback:
  - thumbnail generation is asynchronous and non-blocking
  - preview generation is optional and only patched when the preview transform probe succeeds
  - if preview generation never runs, the original video remains usable in the UI
  - if thumbnail generation fails, the original video still remains usable in the UI
- The legacy ffmpeg-based Convex secondary-assets path has been removed from the repo.

### What changed in this track
1. Added worker-safe secondary-assets state + callbacks in [secondaryAssets.ts](convex/secondaryAssets.ts).
2. Added `secondary_assets` dispatch plumbing in [cloudflareDispatch.ts](convex/cloudflareDispatch.ts).
3. Registered secured secondary-assets worker routes in [http.ts](convex/http.ts) and [cloudflareWorkerHttp.ts](convex/cloudflareWorkerHttp.ts).
4. Extended the shared Worker in [workers/bloomstudio-worker/src/index.ts](workers/bloomstudio-worker/src/index.ts) to claim/continue/complete/fail `secondary_assets` jobs.
5. Replaced Browser Rendering with Cloudflare Media Transformations URL generation + probe validation on the worker plane.
6. Replaced the active single/batch completion scheduling in:
   - [singleGeneration.ts](convex/singleGeneration.ts)
   - [batchGeneration.ts](convex/batchGeneration.ts)
7. Extended delete/orphan-cleanup paths so preview keys are now treated as first-class R2 assets.
8. Hardened the worker secondary-assets path so transform misconfiguration and unsupported media fail cleanly instead of retrying forever.
9. Updated the gallery UI to treat Cloudflare-transformed video thumbnails as image thumbnails.
10. Removed the old Convex runtime stack that previously owned provider waits and ffmpeg work:
   - `singleGenerationProcessor.ts`
   - `batchProcessor.ts`
   - `secondaryAssetsProcessor.ts`
   - `convex/lib/r2.ts`
   - `convex/lib/videoThumbnail.ts`
   - `convex/lib/videoPreview.ts`
   - related thumbnail migration helpers/scripts

### Important limitation
- This track migrated secondary-assets ownership off Convex for new worker-backed traffic.
- It now provides a production-shaped Cloudflare-native derivative path in code and the Cloudflare zone path is live.
- Real dev probes on 2026-03-12 established:
  - Browser Rendering can fail with `VIDEO_NOT_SUPPORTED: Video source or codec is not supported by Browser Rendering`
  - the new Media Transformations URL shape is implemented and deployed in dev
  - Cloudflare zone-level Media Transformations is enabled with the required R2 origins allowed
  - `media.bloomstudio.fun/health` is serving from the Cloudflare worker edge
  - `media.bloomstudio.fun/cdn-cgi/media/...` now succeeds against a real dev video for both thumbnail and preview probes
  - preview videos still fall back to the original video URL when the preview transform probe fails
  - Convex no longer spends heavy Node compute on this path

### Next required outcome
Run the final edge-case smoke passes, then shift from migration work to normal post-release monitoring and cleanup.

### Non-negotiable constraints
- Do not use Docker.
- Do not make secondary assets part of the main generation critical path.
- Do not break current fallback behavior:
  - no thumbnail/preview must still leave the original video usable
- Keep Convex as the system of record for final media URLs.
- Reuse the existing shared Worker/queue architecture unless there is a proven need to split.

### Recommended implementation shape
1. Keep `secondary_assets` on the shared Worker/queue unless scale forces a split.
2. If derivative generation is added, preserve the existing callback contract:
   - thumbnail fields optional
   - preview fields optional
   - never touch main generation terminal state
3. Keep failures non-fatal:
   - the Worker can mark secondary-assets processing failed
   - the original video must remain usable
4. Update cleanup paths when derivative generation becomes real traffic:
   - single delete
   - bulk delete
   - orphan cleanup / audits
   - this is now done for preview keys

### Design constraint for the next developer
The prior derivative implementation relied on ffmpeg-style processing inside Convex Node. That path has now been removed and should not be reintroduced.

The new Worker implementation already takes the intended direction:
- Cloudflare Media Transformations for thumbnail/preview URLs
- no Docker
- no ffmpeg in Convex
- graceful fallback when transforms are unavailable

The remaining work is operational, not architectural:
- validate fresh dev videos end to end

### Exact files to review first
- [secondaryAssets.ts](convex/secondaryAssets.ts)
- [singleGeneration.ts](convex/singleGeneration.ts)
- [batchGeneration.ts](convex/batchGeneration.ts)
- [index.ts](workers/bloomstudio-worker/src/index.ts)
- [cloudflareDispatch.ts](convex/cloudflareDispatch.ts)
- [cloudflareWorkerHttp.ts](convex/cloudflareWorkerHttp.ts)

### Exact next tasks
1. [x] Finish storage cleanup coverage for derivative objects:
   - include `previewR2Key` in delete flows
   - include preview objects in orphan cleanup/audit
   - this is now done
2. [x] Implement a non-Docker preview-video path in the Worker plane.
   - done via Cloudflare Media Transformations URL generation
   - preview remains optional and is only patched when the transform probe succeeds
3. [ ] Validate that:
   - video generation still completes immediately from the user’s perspective
   - supported videos get thumbnails asynchronously afterward
   - the original video still plays correctly when no preview exists
   - secondary-assets failures do not break the original video

### After secondary-assets migration
1. Run the remaining dev validation cases:
   - cancel one single generation
   - refresh the page during an in-flight single generation
   - refresh the page during an in-flight batch
   - capture one retryable provider failure
   - capture one terminal provider failure
2. Inspect the old moderation backlog:
   - if it is draining, leave it alone
   - if it is not, add a one-off recovery/reset script for legacy rows
3. Review Convex compute again.
4. Decide whether dev is ready for a staged production rollout.

## Production Cutover

This section is the production handoff checklist once the dev migration is considered complete.

### Current production readiness
- The production Cloudflare resource names are already codified in [wrangler.jsonc](wrangler.jsonc):
  - Worker: `bloomstudio-worker`
  - queue: `bloomstudio-prod-queue`
  - DLQ: `bloomstudio-prod-dlq`
  - bucket: `bloomstudio-prod`
- The production Convex deployment URL is already wired in code:
  - `https://careful-buffalo-514.convex.site`
- Production Convex already has the core provider/app secrets needed by the worker-plane architecture.
- The production Worker exists and has previously been deployed.
- The Media Transformations worker code has been validated in dev and is now deployed to production.
- The latest Convex backend was pushed to production on 2026-03-12 after the legacy processor stack was removed.
- Real production transform probes on 2026-03-12 succeeded against a production R2 video:
  - thumbnail: `200 image/jpeg`
  - preview: `200 video/mp4`
- Real production secondary-assets dispatch was re-validated on 2026-03-12 after correcting worker-secret drift:
  - a manual redispatch completed successfully
  - the target production row settled back to `secondaryAssetsDispatchStatus = "completed"`
  - `thumbnailUrl` and `previewUrl` were present on the row after completion

### What is still required before production cutover
- [x] A production-safe secondary-assets backend is now implemented in code using Cloudflare Media Transformations.
- [x] Enable Media Transformations on the production zone path (`bloomstudio.fun`) and allow the production R2 public origin.
- [x] The production Worker exists.
- [x] The production Worker core secrets have been set explicitly.
- [x] The latest Worker code has been deployed to production.
- [x] The latest Convex backend has been pushed to production for the current migration slice.

### Required production Worker secrets
Set these on the production Worker:
- `BLOOMSTUDIO_WORKER_SHARED_SECRET`
- `CEREBRAS_API_KEY`
- `GROQ_API_KEY`
- `OPENROUTER_API_KEY`
- no additional secondary-assets transcode secret is required for the current Media Transformations path

### Required production Convex env
Set or verify these on production Convex:
- `CLOUDFLARE_WORKER_BASE_URL`
- `BLOOMSTUDIO_WORKER_SHARED_SECRET`

### Production cutover checklist
1. Finish and validate the remaining migration work in dev.
2. [x] Verify the chosen production video-derivative path is actually valid for Bloom Studio MP4 outputs.
3. [x] Verify production Worker secrets are set.
4. [x] Verify production Convex env points at the production Worker URL and shared secret.
5. [x] Deploy the Worker:
   - `bun run cf:deploy:prod`
6. [x] Push the Convex backend to production.
7. Run a small controlled production smoke test:
   - one safe image
   - one explicit image
   - one small batch
   - one video if secondary-assets migration is already included
8. Confirm:
   - generation completion still reaches the UI
   - moderation remains non-blocking
   - batch still survives refresh/reconnect
   - no unexpected queue or callback failures occur
9. Watch production metrics closely after cutover:
   - Convex action compute
   - Worker queue backlog
   - Worker callback errors
   - stuck generation or moderation rows

### Production rollback
If production issues appear after cutover:
1. Redeploy the prior known-good Worker version or remove the new Worker routing dependency.
2. Redeploy the prior known-good Convex backend.
3. Leave persisted generation/image state intact; rollback should target execution paths, not user data.

### Definition of production readiness
Production is ready when:
- the full intended worker-plane path is validated in dev
- production secrets and env are in place
- production smoke tests pass
- initial post-deploy monitoring shows no meaningful queue/callback regression

## Release Path

- [x] `vercel.json` now uses `bunx convex deploy --cmd 'bun run build'` so the production web deploy path stays Bun-only.
- [x] `.github/workflows/release.yml` now:
  - installs Bun dependencies
  - syncs `BLOOMSTUDIO_WORKER_SHARED_SECRET` onto the production Worker
  - deploys the production Cloudflare worker before tagging the release
- [x] GitHub repo secrets required for that workflow are set:
  - `CLOUDFLARE_API_TOKEN`
  - `BLOOMSTUDIO_WORKER_SHARED_SECRET`
- Release branch behavior remains:
  - GitHub workflow fast-forwards `release` to `main`
  - push to `release` triggers the production Vercel deployment
  - Vercel build deploys the production Convex backend

### Production issue found and fixed

- On 2026-03-12, production secondary-assets redispatch returned `401 Unauthorized`.
- Root cause: the production Worker secret had drifted from the production Convex `BLOOMSTUDIO_WORKER_SHARED_SECRET`.
- Fix:
  - reset the production Worker secret explicitly with Wrangler
  - re-validated dispatch from production Convex
  - confirmed the target production video row completed normally

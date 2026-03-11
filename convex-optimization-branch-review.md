# Convex Optimization Branch Review

## Scope

I reviewed the branch against `origin/main` with focus on the changes tied to `convex-optimiziations.md`, especially:

- `convex/batchGeneration.ts`
- `convex/batchProcessor.ts`
- `convex/singleGeneration.ts`
- `convex/singleGenerationProcessor.ts`
- `hooks/queries/use-generate-image.ts`
- `components/debug/limit-tester.tsx`
- related tests and UI surfaces

I also cross-checked Convex-specific judgments against current official guidance:

- `https://docs.convex.dev/functions/actions`
- `https://docs.convex.dev/understanding/best-practices/`
- `https://docs.convex.dev/scheduling/scheduled-functions`
- `@convex-dev/workpool` README

I ran the relevant test files as well:

```bash
bun run test hooks/queries/use-generate-image.test.tsx hooks/queries/use-batch-generation.test.ts hooks/use-batch-mode.test.ts
```

Those tests all passed, which is important context for the testing-gap finding below.

## High-level take

The overall direction of the branch is good and largely aligned with current Convex guidance:

- moving retry waiting out of long-running actions is directionally correct
- adding hard fetch timeouts is good
- removing the extra single-generation action wrapper is directionally correct
- adaptive throttling is a reasonable next step

The main problem is that the new batch state machine has a correctness bug around `pause` / `resume` under pipelined scheduling.

## Findings

## P1 - Resuming a paused batch can duplicate item processing

- **Severity**: P1
- **Type**: clear bug, business logic regression, UX regression
- **Where**:
  - `convex/batchGeneration.ts:276-335`
  - `convex/batchGeneration.ts:700-738`
  - `convex/batchProcessor.ts:192-225`
  - `components/studio/batch/batch-action-button.tsx:49-50`
  - `components/studio/batch/batch-action-button.tsx:95-125`

### Why this is a bug

`currentIndex` is advanced when the next item is **scheduled**, not when it is **completed**.

That means a paused batch can legitimately be in this state:

- item `N` already scheduled / still in flight
- `currentIndex === N`
- UI shows `"N images finishing..."`

`resumeBatchJob` then immediately schedules `currentIndex` again:

- `convex/batchGeneration.ts:731-735`

So if the user resumes before the already-scheduled item drains, the same item index can be processed twice.

Because each first-attempt batch item also pipelines the next item at the start of processing:

- `convex/batchProcessor.ts:192-204`

this can cascade into:

- duplicate generated images
- inflated `completedCount` / `failedCount`
- premature `totalProcessed >= totalCount`
- early deletion of the batch job record

### Why the UX contributes to it

The UI explicitly surfaces that items are still finishing while paused:

- `showInFlightIndicator = isPaused && inFlightCount > 0`

but the same button still exposes `Resume` immediately. So the UI currently invites the exact unsafe transition that corrupts the batch state.

### Recommendation

Resume should not schedule a new item while any prior scheduled work is still outstanding.

At minimum, resume needs one of these invariants:

- only resume when `inFlightCount === 0`
- track a separate `nextUnprocessedIndex` instead of reusing `currentIndex`
- persist scheduled item identities so resume can tell whether the next index is already queued

## P2 - `inFlightCount` becomes wrong after resume

- **Severity**: P2
- **Type**: clear bug, UI/UX regression
- **Where**:
  - `convex/batchGeneration.ts:151-175`
  - `convex/batchGeneration.ts:303-318`
  - `convex/batchGeneration.ts:438-450`
  - `convex/batchGeneration.ts:724-735`

### Why this is a bug

The system treats `inFlightCount` as including already-scheduled outstanding work:

- initial batch starts with `inFlightCount: 1`
- scheduling the next item increments it
- recording a result decrements it

But `resumeBatchJob` schedules work without incrementing `inFlightCount`.

That means after a clean paused state with `inFlightCount = 0`, resuming undercounts by one immediately. From there the counter can hit zero even though work is still running or scheduled.

### Impact

- the paused UI can claim everything has drained when one item is still outstanding
- users can think it is safe to resume / pause again when it is not
- any future logic that relies on `inFlightCount` as a drain signal will be unreliable

This also makes the P1 duplication bug easier to trigger repeatedly.

### Recommendation

Either:

- increment `inFlightCount` when resume schedules the restart item

or better:

- redesign the batch state model so `inFlightCount` is derived from durable queued/running state instead of manual increments/decrements

## P3 - The new batch lifecycle is not protected by regression tests

- **Severity**: P3
- **Type**: high-value testing gap
- **Where**:
  - `hooks/use-batch-mode.test.ts:306-442`
  - `hooks/queries/use-batch-generation.test.ts:46-107`
  - `hooks/queries/use-batch-generation.test.ts:141-171`

### Why this matters

I ran the relevant tests and they all passed, but the current coverage only checks:

- basic hook return shapes
- simple paused/processing flag mapping
- simple progress mapping

It does **not** cover the dangerous transitions introduced by the optimization work:

- pause while scheduled items are still outstanding
- resume before in-flight work drains
- `currentIndex` / `inFlightCount` invariants under pipelining
- duplicate scheduling protection

This is why the P1/P2 bug can exist while the branch still looks green.

### Recommendation

Add targeted tests around the batch state machine, not just hook shape tests. The minimum valuable cases are:

- paused batch with `inFlightCount > 0` cannot safely schedule the same `currentIndex` twice
- resume preserves correct `inFlightCount`
- total processed count cannot be incremented twice for the same item index

## P4 - Old public single-generation wrapper is now stale API surface

- **Severity**: P4
- **Type**: maintainability / API hygiene
- **Where**:
  - `convex/singleGeneration.ts:106-134`
  - current consumers now use `api.singleGenerationProcessor.processGeneration`

### Why this matters

This branch correctly moved the hot path to the public `singleGenerationProcessor.processGeneration` action, which removes the extra wrapper layer and is more in line with current Convex guidance about avoiding unnecessary `runAction` overhead.

However, `singleGeneration.dispatchGeneration` is still exported as a public action even though current consumers no longer use it.

That leaves two public entrypoints for the same behavior:

- the new direct path
- the old wrapper path

Low severity, but it increases confusion and makes it easy for a future caller to accidentally reintroduce the extra wrapper overhead.

### Recommendation

Remove the stale public wrapper or make the public API converge on one entrypoint only.

## Non-findings worth calling out

These branch decisions looked good after doc validation and I would keep them:

- **Retry rescheduling instead of sleeping in actions**
  - aligned with the cost problem described in the spec
- **Hard provider fetch timeout**
  - good protection against long-tail provider stalls
- **Removing the extra single-generation action wrapper from the hot path**
  - aligned with current Convex guidance that `runAction` should generally only be used when crossing runtimes
- **Adaptive throttling as a scheduler-level control**
  - reasonable, and Workpool is not obviously required yet if the batch lifecycle bugs are fixed first

## Recommended fix order

- **First**: fix P1 and P2 together in the batch state machine
- **Second**: add the regression tests from P3 before making further scheduler tweaks
- **Third**: clean up the stale single-generation wrapper from P4

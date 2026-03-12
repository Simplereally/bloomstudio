# Convex Architecture Guidance

This document is the narrowed source of truth for reviewing and improving this codebase's Convex usage around durable background work, action compute, and refresh-safe reactive UX.

## Core Principles

### 1. Start durable background work from a mutation
- Record intent in Convex first, then schedule the background function with `ctx.scheduler.runAfter(...)` in the same mutation.
- Do not rely on a second client-triggered action to begin work.
- Use `internal.*` functions for scheduled work.

### 2. Preserve refresh-safe reactive UX with persisted status
- The client should subscribe to persisted job state with `useQuery`, not poll external APIs or depend on in-memory state.
- Background actions should update that status via `ctx.runMutation(...)`.
- Refreshing, closing, or reconnecting should only re-subscribe to the same persisted records.

### 3. Never sleep inside Node actions
- No `sleep`, `setTimeout`, or retry backoff waits inside Convex actions.
- Any delay between attempts or items should happen via `ctx.scheduler.runAfter(...)` so no compute is billed while idle.
- Scheduled actions are at-most-once; if retries are needed, the retry path must be explicit and idempotent.

### 4. Keep state transitions simple and defensible
- Claiming or transitioning work must happen transactionally.
- Terminal transitions should have a single guarded code path.
- Check-and-set patterns are required anywhere completion, cancellation, or retry can race.
- Recovery paths should use lightweight persisted state to skip already-completed phases instead of redoing external work.

### 5. Keep hot-path documents small and indexed
- Frequently-updated job records should contain only status, timestamps, ownership, and lightweight metadata.
- Heavy payloads belong in side tables.
- Queries that fetch active work should use indexes, not table scans or broad `.filter(...)` reads.

## Code Review Checklist

### Durable job start
- Is background work scheduled directly from the mutation that creates the job?
- Is there any client fire-and-forget `useAction(...)` path that duplicates server scheduling?

### Reactive UX
- Does the UI derive active work from persisted Convex queries?
- Can the user refresh and still observe in-flight work and completed results correctly?

### Action compute
- Is any action waiting idle with `sleep`, `setTimeout`, or retry loops?
- Can delays be moved to scheduled follow-up actions instead?

### Correctness
- Are retry, claim, cancel, and completion transitions idempotent?
- Is there a single guarded path to terminal state updates?
- Are there stale or duplicate dispatch paths left around after optimizations?

### Data access
- Do active-work queries use narrow indexes?
- Are large or sensitive blobs kept off hot-path documents?

## Repo-Specific Implications

- Single-generation and batch generation should remain mutation-started, scheduler-driven, and query-observed.
- Any background moderation, inference, or secondary processing should also avoid billed idle time inside actions.
- If custom retry/concurrency/state-machine code continues to grow beyond a simple single-step scheduler model, reassess whether a Convex component such as Workpool is the better fit.

## Operational Signals To Watch

- High action duration relative to actual external API time usually means in-action waiting.
- Growing counts of long-stuck `pending` or `processing` records indicate missing recovery or invalid transitions.
- High read volume on active-work queries usually indicates a missing or weak index.

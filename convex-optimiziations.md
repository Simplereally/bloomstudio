Yes — there’s a clear path to reduce this **a lot** while keeping the same UX.

## What’s likely driving cost

Based on your code + latest Convex docs:

- `singleGenerationProcessor.processGeneration` and `batchProcessor.processBatchItem` are both Node actions (`"use node"`), and Node actions are billed at **512MB** runtime memory ([limits](https://docs.convex.dev/production/state/limits.md)).
- Both actions spend significant wall-time waiting on external work (Pollinations + retries), and in `fetchWithRetry` you currently **sleep inside the action** between retries (`convex/lib/retry.ts`).
- `singleGeneration.dispatchGeneration` wraps `processGeneration` via `ctx.runAction(...)` (`convex/singleGeneration.ts`), which Convex docs call out as overhead-heavy unless crossing runtimes ([actions best practices](https://docs.convex.dev/functions/actions)).
- Batch scheduling is aggressively pipelined (`100ms + jitter`) in `convex/batchGeneration.ts`, which can increase 429/5xx retry pressure and burn more GBh.

## Highest-impact fixes (without UX loss)

1. **Move retry backoff out of running actions**
   - Instead of `sleep(...)` in `fetchWithRetry`, schedule the next retry attempt via `ctx.scheduler.runAfter(...)` and exit.
   - Keeps persistence, keeps reactive UX, cuts billed “idle waiting” time.

2. **Add hard fetch timeout + retry by reschedule**
   - Abort slow provider calls (e.g. 45-90s depending image/video), mark attempt, reschedule.
   - Prevents long-tail stuck calls from eating GBh.

3. **Adaptive batch throttling**
   - Dynamically increase inter-item delay when 429/5xx spike, decrease when healthy.
   - Usually lowers retries and total GBh while keeping throughput stable.

4. **Remove extra action wrapper overhead in single flow**
   - Current: client -> `dispatchGeneration` action -> `runAction(processGeneration)`.
   - Better: reduce one layer (or switch back to mutation-scheduled processor if acceptable).
   - This is a smaller win than #1/#2 but still worthwhile.

5. **Stop burning real generation compute in dev by default**
   - Your `dev` usage is huge too. Add a dev-only mock/placeholder path unless explicitly enabled.

## Convex-idiomatic guidance (2026 docs)

- Mutation that records intent + schedules background work is still the canonical pattern ([scheduled functions](https://docs.convex.dev/scheduling/scheduled-functions), [actions](https://docs.convex.dev/functions/actions)).
- Free tier has tight scheduled concurrency; if you need controlled parallelism/retries, `@convex-dev/workpool` is now a strong fit ([workpool README](https://raw.githubusercontent.com/get-convex/workpool/main/README.md)).

## Recommended order for you

- **Phase 1 (fast, biggest ROI):** #1 + #2 + #5  
- **Phase 2:** #3  
- **Phase 3:** #4 / workpool migration if needed

If you want, I can implement **Phase 1 now** directly in your codebase (retry rescheduling + timeout + dev guard) and keep your current UX contract intact.
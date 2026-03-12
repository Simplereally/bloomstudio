# 📋 Test Coverage Audit

> **Generated:** 2026-01-19T06:01:38.184Z

---

## 📊 Summary

| Metric | Count |
|--------|-------|
| **Total Source Files** | 376 |
| **With Tests** | 165 ✅ |
| **Without Tests** | 211 ❌ |
| **Coverage** | **43.9%** |

---

## 🎯 Untested Files by Category

### Convex Functions (19 files)
> Backend mutations, queries, and actions

**`convex/`**
- [x] `crons.ts` <!-- Agent 2 -->
- [x] `favorites.ts`
- [x] `follows.ts`
- [x] `generatedImages.ts`
- [x] `http.ts` <!-- Agent 6 -->
- [x] `orphanCleanup.ts` <!-- Agent 3 -->
- [-] `orphanCleanupQueries.ts` <!-- Agent 3 -->
- [x] `promptInference.ts`
- [x] `promptLibrary.ts` <!-- Agent 3 -->
- [x] `referenceImages.ts` <!-- Agent 6 -->
- [ ] `schema.ts`
- [x] `sensitivityMigration.ts` <!-- Agent 4 -->
- [x] `singleGeneration.ts`
- [x] `stripe.ts`
- [x] `users.ts`

### Convex Libraries (5 files)
> Shared Convex utilities

**`convex\lib/`**
- [ ] `index.ts`
- [x] `providerHealthFunctions.ts` <!-- Agent 4 -->
- [x] `subscription.ts` <!-- Agent 5 -->

### Hooks (10 files)
> Custom React hooks

**`hooks/`**
- [ ] `index.ts`
- [x] `use-prompt-library-form.ts` <!-- Agent 4 -->
- [x] `use-scroll-spy.ts` <!-- Agent 4 -->
- [ ] `use-slideshow.ts`
- [x] `use-smart-video.ts` ✅
- [ ] `use-video-slideshow.ts`

**`hooks\mutations/`**
- [x] `use-set-visibility.ts` <!-- Agent 4 -->

**`hooks\queries/`**
- [ ] `index.ts`
- [x] `use-batch-generation.ts` <!-- Agent 5 -->
- [ ] `use-suggestions.ts`

### Lib Utilities (34 files)
> Core utility functions

**`lib/`**
- [ ] `analytics.ts`
- [ ] `feed-types.ts`
- [ ] `seo-config.ts`
- [ ] `test-utils.ts`

**`lib\ai-provider/`**
- [x] `ai-provider.ts` ✅ <!-- Agent 1 -->
- [-] `index.ts` <!-- Agent 1 -->

**`lib\api/`**
- [ ] `index.ts`

**`lib\auth/`**
- [ ] `index.ts`

**`lib\cerebras/`**
- [ ] `cerebras-config.ts`
- [ ] `index.ts`

**`lib\config/`**
- [ ] `stripe.ts`

**`lib\errors/`**
- [x] `index.ts` ✅ <!-- Agent 1 -->
- [x] `toast-errors.ts` ✅ <!-- Agent 1 -->

**`lib\openrouter/`**
- [ ] `index.ts`
- [ ] `openrouter-config.ts`

**`lib\pollen-auth/`**
- [ ] `index.ts`
- [ ] `storage.ts`

**`lib\prompt-enhancement/`**
- [x] `enhancement-prompts.ts` ✅ <!-- Agent 1 -->
- [ ] `index.ts`
- [x] `prompt-enhancer.ts` ✅
- [x] `suggestion-generator.ts` ✅

**`lib\query/`**
- [ ] `index.ts`
- [ ] `query-client.ts`
- [ ] `query-keys.ts`

**`lib\schemas/`**
- [x] `pollinations-pricing.schema.ts` <!-- Agent 5 -->
- [x] `server-generate.schema.ts` <!-- Agent 5 -->

**`lib\storage/`**
- [ ] `index.ts`
- [-] `r2-client.ts` <!-- Agent 5 -->
- [-] `retry.ts` <!-- Agent 2 -->

**`lib\stripe/`**
- [ ] `client.ts`
- [ ] `index.ts`
- [ ] `stripe.ts`

**`lib\utils/`**
- [ ] `index.ts`
- [x] `set-input-value-with-undo.ts` ✅ <!-- Agent 1 -->

### Studio Components (25 files)
> Studio page components

**`components\studio/`**
- [x] `delete-image-dialog.tsx` <!-- Agent 6 -->
- [ ] `index.ts`
- [x] `upload-progress.tsx` <!-- Agent 6 -->

**`components\studio\batch/`**
- [x] `batch-image-grid.tsx` <!-- Agent 6 -->
- [x] `batch-mode-panel.tsx` <!-- Agent 6 -->
- [x] `batch-progress-indicator.tsx` <!-- Agent 6 -->
- [ ] `index.ts`

**`components\studio\canvas/`**
- [ ] `canvas-wave.tsx`
- [ ] `luminous-tide-effect.tsx`

**`components\studio\controls/`**
- [ ] `megapixel-budget.tsx`
- [ ] `prompt-section.tsx`

**`components\studio\features/`**
- [ ] `index.ts`

**`components\studio\features\canvas/`**
- [ ] `index.ts`

**`components\studio\features\generation/`**
- [ ] `index.ts`

**`components\studio\features\history/`**
- [ ] `index.ts`

**`components\studio\features\prompt/`**
- [ ] `index.ts`

**`components\studio\features\prompt-library/`**
- [ ] `creatable-styles.ts`
- [ ] `index.ts`
- [ ] `prompt-library-button.tsx`
- [ ] `prompt-library-header.tsx`
- [ ] `save-prompt-button.tsx`
- [ ] `types.ts`

**`components\studio\gallery/`**
- [ ] `thumbnail-item.tsx`
- [ ] `types.ts`

**`components\studio\mobile/`**
- [ ] `index.ts`

### Gallery Components (1 files)
> Gallery and image components

**`components\gallery/`**
- [ ] `favorites-client.tsx`

### UI Components (10 files)
> Reusable UI primitives

**`components\ui/`**
- [x] `branded-loading.tsx` <!-- Agent 6 -->
- [x] `button-group.tsx` <!-- Agent 6 -->
- [x] `enhance-button.tsx` <!-- Agent 6 -->
- [x] `input-group.tsx` <!-- Agent 6 -->
- [x] `item.tsx` <!-- Agent 6 -->
- [x] `masonry-grid.tsx` <!-- Agent 6 -->
- [x] `rich-tooltip.tsx` <!-- Agent 6 -->
- [x] `slideshow.tsx` <!-- Agent 6 -->
- [x] `smart-video.tsx` ✅
- [x] `video-slideshow.tsx` <!-- Agent 6 -->

### Other Components (52 files)
> Other component files

**`components/`**
- [ ] `clerk-theme-provider.tsx`
- [x] `error-boundary.tsx` ✅ <!-- Agent 1 -->
- [ ] `github-star-button.tsx`
- [ ] `theme-provider.tsx`

**`components\debug/`**
- [ ] `limit-tester.tsx`

**`components\gl/`**
- [ ] `gl.tsx`
- [ ] `particles.tsx`

**`components\gl\shaders/`**
- [ ] `dof-points-material.tsx`
- [ ] `simulation-material.tsx`
- [ ] `utils.ts`
- [ ] `vignette-shader.tsx`

**`components\landing/`**
- [ ] `community-section.tsx`
- [ ] `competitor-comparison.tsx`
- [ ] `cta-section.tsx`
- [ ] `faq-section.tsx`
- [ ] `feature-card.tsx`
- [ ] `features-section.tsx`
- [ ] `floating-gallery.tsx`
- [ ] `floating-orb.tsx`
- [ ] `gl-background.tsx`
- [ ] `hero-section.tsx`
- [ ] `landing-header.tsx`
- [ ] `living-strip.tsx`
- [ ] `model-badge.tsx`
- [ ] `models-section.tsx`
- [ ] `scroll-reveal.tsx`
- [ ] `showcase-image.tsx`
- [ ] `showcase-section.tsx`
- [ ] `value-prop-section.tsx`

**`components\layout/`**
- [ ] `footer.tsx`

**`components\pollen-auth/`**
- [ ] `global-reconnect-modal.tsx`
- [ ] `index.ts`

**`components\pollen-balance/`**
- [ ] `index.ts`

**`components\pricing/`**
- [ ] `feature-detail-dialog.tsx`
- [ ] `model-value-showcase.tsx`

**`components\profile/`**
- [ ] `profile-skeleton.tsx`

**`components\providers/`**
- [ ] `convex-client-provider.tsx`
- [ ] `index.ts`
- [ ] `pollen-auth-provider.tsx`
- [ ] `query-provider.tsx`

**`components\seo/`**
- [ ] `json-ld.tsx`

**`components\settings/`**
- [ ] `api-card.tsx`
- [ ] `appearance-card.tsx`
- [ ] `star-repo-card.tsx`
- [ ] `subscription-card.tsx`

**`components\settings\api-card-components/`**
- [ ] `index.ts`

**`components\solutions/`**
- [ ] `solution-faq.tsx`
- [ ] `solution-features.tsx`
- [ ] `solution-hero-carousel.tsx`
- [ ] `solution-hero.tsx`
- [ ] `solution-showcase.tsx`
- [ ] `solution-steps.tsx`

### App Routes (49 files)
> Next.js pages and server actions

**`app/`**
- [ ] `layout.tsx`
- [ ] `loading.tsx`
- [ ] `page.tsx`
- [ ] `robots.ts`
- [ ] `sitemap.ts`

**`app\_server\actions/`**
- [ ] `history.ts`

**`app\_server\convex/`**
- [ ] `client.ts`

**`app\about/`**
- [ ] `loading.tsx`
- [ ] `page.tsx`

**`app\actions/`**
- [ ] `image-actions.ts`

**`app\api\images\delete/`**
- [ ] `route.ts`

**`app\api\images\delete-bulk/`**
- [ ] `route.ts`

**`app\api\upload/`**
- [ ] `route.ts`

**`app\contact/`**
- [ ] `loading.tsx`
- [ ] `page.tsx`

**`app\faq/`**
- [ ] `loading.tsx`
- [ ] `page.tsx`

**`app\favorites/`**
- [ ] `loading.tsx`
- [ ] `page.tsx`

**`app\feed/`**
- [ ] `loading.tsx`
- [ ] `page.tsx`

**`app\feed\[type]/`**
- [ ] `page.tsx`

**`app\history/`**
- [ ] `loading.tsx`
- [ ] `page.tsx`

**`app\limit-test/`**
- [ ] `page.tsx`

**`app\pricing/`**
- [ ] `checkout-button.tsx`
- [ ] `loading.tsx`
- [ ] `page.tsx`
- [ ] `pricing-data.tsx`

**`app\privacy/`**
- [ ] `loading.tsx`
- [ ] `page.tsx`

**`app\profile/`**
- [ ] `loading.tsx`

**`app\settings/`**
- [ ] `layout.tsx`
- [ ] `loading.tsx`

**`app\sign-in/`**
- [ ] `layout.tsx`
- [ ] `loading.tsx`

**`app\sign-in\[[...sign-in]]/`**
- [ ] `page.tsx`

**`app\sign-up/`**
- [ ] `layout.tsx`
- [ ] `loading.tsx`

**`app\sign-up\[[...sign-up]]/`**
- [ ] `page.tsx`

**`app\site-map/`**
- [ ] `page.tsx`

**`app\solutions/`**
- [ ] `loading.tsx`

**`app\solutions\[slug]/`**
- [ ] `page.tsx`

**`app\studio/`**
- [ ] `loading.tsx`
- [ ] `page.tsx`

**`app\support/`**
- [ ] `loading.tsx`
- [ ] `page.tsx`

**`app\terms/`**
- [ ] `loading.tsx`
- [ ] `page.tsx`

### Scripts (3 files)
> Build and utility scripts

**`scripts/`**
- [ ] `audit-tests.ts`
- [ ] `optimize-solutions.ts`

### Types (1 files)
> TypeScript type definitions

**`types/`**
- [ ] `pollinations.ts`

### Other (2 files)
> Uncategorized files

**`./`**
- [ ] `image-lightbox-old.tsx`
- [ ] `use-image-lightbox-old.tsx`

---

## ℹ️ Notes

- **Excluded:** Config files, `.d.ts` definitions, shadcn/ui components, test setup files
- **Test patterns recognized:** `.test.ts`, `.test.tsx`, `.spec.ts`, `.spec.tsx`
- Checkbox format allows tracking progress in markdown editors

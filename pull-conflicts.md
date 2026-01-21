User@DESKTOP-EV6QN3L MINGW64 /c/Code/pixelstream (main)
$ git stash -u
warning: LF will be replaced by CRLF in lint_report.txt.
The file will have its original line endings in your working directory
warning: LF will be replaced by CRLF in lint_reports/max-lines.txt.
The file will have its original line endings in your working directory
warning: LF will be replaced by CRLF in scripts/fix-test-types.mjs.
The file will have its original line endings in your working directory
warning: LF will be replaced by CRLF in scripts/process-lint-json.ts.
The file will have its original line endings in your working directory
Saved working directory and index state WIP on main: 87041aa chore: add tests

User@DESKTOP-EV6QN3L MINGW64 /c/Code/pixelstream (main)
$ git pull
Updating 87041aa..444c520
Fast-forward
 convex/batchGeneration.test.ts             | 121 ----------
 convex/batchProcessor.test.ts              | 282 ----------------------
 convex/contentAnalysis.test.ts             |  61 -----
 convex/crons.test.ts                       |  59 -----
 convex/detailsMigration.test.ts            |  82 -------
 convex/favorites.test.ts                   | 189 ---------------
 convex/follows.test.ts                     | 156 ------------
 convex/generatedImages.test.ts             | 327 -------------------------
 convex/http.test.ts                        | 123 ----------
 convex/lib/crypto.test.ts                  |  47 ----
 convex/lib/groq.test.ts                    | 207 ----------------
 convex/lib/nsfwDetection.test.ts           |  53 ----
 convex/lib/openrouter.test.ts              | 346 --------------------------
 convex/lib/pollinations.test.ts            | 376 -----------------------------
 convex/lib/promptInference.test.ts         |  69 ------
 convex/lib/providerHealth.test.ts          | 193 ---------------
 convex/lib/providerHealthFunctions.test.ts | 159 ------------
 convex/lib/r2.test.ts                      |  69 ------
 convex/lib/retry.test.ts                   | 198 ---------------
 convex/lib/subscription.test.ts            | 201 ---------------
 convex/lib/videoPreview.test.ts            | 121 ----------
 convex/lib/videoThumbnail.test.ts          | 129 ----------
 convex/lib/visionAnalysis.test.ts          |  57 -----
 convex/orphanCleanup.test.ts               | 197 ---------------
 convex/orphanCleanupQueries.test.ts        | 105 --------
 convex/promptInference.test.ts             | 115 ---------
 convex/promptLibrary.test.ts               | 249 -------------------
 convex/rateLimits.test.ts                  | 106 --------
 convex/referenceImages.test.ts             | 131 ----------
 convex/sensitivityMigration.test.ts        | 128 ----------
 convex/singleGeneration.test.ts            | 189 ---------------
 convex/singleGenerationProcessor.test.ts   | 133 ----------
 convex/stripe.test.ts                      | 145 -----------
 convex/tempTagStats.test.ts                | 241 ------------------
 convex/thumbnailMigration.test.ts          | 181 --------------
 convex/thumbnailMigrationActions.test.ts   | 163 -------------
 convex/usernameGenerator.test.ts           | 206 ----------------
 convex/users.test.ts                       | 337 --------------------------
 eslint.config.mjs                          |  12 +
 tsconfig.json                              |   4 +-
 40 files changed, 15 insertions(+), 6252 deletions(-)
 delete mode 100644 convex/batchGeneration.test.ts
 delete mode 100644 convex/batchProcessor.test.ts
 delete mode 100644 convex/contentAnalysis.test.ts
 delete mode 100644 convex/crons.test.ts
 delete mode 100644 convex/detailsMigration.test.ts
 delete mode 100644 convex/favorites.test.ts
 delete mode 100644 convex/follows.test.ts
 delete mode 100644 convex/generatedImages.test.ts
 delete mode 100644 convex/http.test.ts
 delete mode 100644 convex/lib/crypto.test.ts
 delete mode 100644 convex/lib/groq.test.ts
 delete mode 100644 convex/lib/nsfwDetection.test.ts
 delete mode 100644 convex/lib/openrouter.test.ts
 delete mode 100644 convex/lib/pollinations.test.ts
 delete mode 100644 convex/lib/promptInference.test.ts
 delete mode 100644 convex/lib/providerHealth.test.ts
 delete mode 100644 convex/lib/providerHealthFunctions.test.ts
 delete mode 100644 convex/lib/r2.test.ts
 delete mode 100644 convex/lib/retry.test.ts
 delete mode 100644 convex/lib/subscription.test.ts
 delete mode 100644 convex/lib/videoPreview.test.ts
 delete mode 100644 convex/lib/videoThumbnail.test.ts
 delete mode 100644 convex/lib/visionAnalysis.test.ts
 delete mode 100644 convex/orphanCleanup.test.ts
 delete mode 100644 convex/orphanCleanupQueries.test.ts
 delete mode 100644 convex/promptInference.test.ts
 delete mode 100644 convex/promptLibrary.test.ts
 delete mode 100644 convex/rateLimits.test.ts
 delete mode 100644 convex/referenceImages.test.ts
 delete mode 100644 convex/sensitivityMigration.test.ts
 delete mode 100644 convex/singleGeneration.test.ts
 delete mode 100644 convex/singleGenerationProcessor.test.ts
 delete mode 100644 convex/stripe.test.ts
 delete mode 100644 convex/tempTagStats.test.ts
 delete mode 100644 convex/thumbnailMigration.test.ts
 delete mode 100644 convex/thumbnailMigrationActions.test.ts
 delete mode 100644 convex/usernameGenerator.test.ts
 delete mode 100644 convex/users.test.ts

User@DESKTOP-EV6QN3L MINGW64 /c/Code/pixelstream (main)
$ git stash pop
Removing use-image-lightbox-old.tsx
Auto-merging tsconfig.json
Removing scripts/optimize-solutions.ts
Removing scripts/migrate-local.ts
Removing image-lightbox-old.tsx
Auto-merging eslint.config.mjs
CONFLICT (content): Merge conflict in eslint.config.mjs
CONFLICT (modify/delete): convex/users.test.ts deleted in Updated upstream and modified in Stashed changes. Version Stashed changes of convex/users.test.ts left in tree.
CONFLICT (modify/delete): convex/usernameGenerator.test.ts deleted in Updated upstream and modified in Stashed changes. Version Stashed changes of convex/usernameGenerator.test.ts left in tree.
Removing convex/thumbnailMigrationActions.ts
Removing convex/thumbnailMigration.ts
CONFLICT (modify/delete): convex/stripe.test.ts deleted in Updated upstream and modified in Stashed changes. Version Stashed changes of convex/stripe.test.ts left in tree.
CONFLICT (modify/delete): convex/singleGenerationProcessor.test.ts deleted in Updated upstream and modified in Stashed 
changes. Version Stashed changes of convex/singleGenerationProcessor.test.ts left in tree.
CONFLICT (modify/delete): convex/singleGeneration.test.ts deleted in Updated upstream and modified in Stashed changes. 
Version Stashed changes of convex/singleGeneration.test.ts left in tree.
CONFLICT (modify/delete): convex/sensitivityMigration.test.ts deleted in Updated upstream and modified in Stashed changes. Version Stashed changes of convex/sensitivityMigration.test.ts left in tree.
CONFLICT (modify/delete): convex/referenceImages.test.ts deleted in Updated upstream and modified in Stashed changes. Version Stashed changes of convex/referenceImages.test.ts left in tree.
CONFLICT (modify/delete): convex/promptLibrary.test.ts deleted in Updated upstream and modified in Stashed changes. Version Stashed changes of convex/promptLibrary.test.ts left in tree.
CONFLICT (modify/delete): convex/promptInference.test.ts deleted in Updated upstream and modified in Stashed changes. Version Stashed changes of convex/promptInference.test.ts left in tree.
CONFLICT (modify/delete): convex/orphanCleanupQueries.test.ts deleted in Updated upstream and modified in Stashed changes. Version Stashed changes of convex/orphanCleanupQueries.test.ts left in tree.
CONFLICT (modify/delete): convex/orphanCleanup.test.ts deleted in Updated upstream and modified in Stashed changes. Version Stashed changes of convex/orphanCleanup.test.ts left in tree.
CONFLICT (modify/delete): convex/lib/videoThumbnail.test.ts deleted in Updated upstream and modified in Stashed changes. Version Stashed changes of convex/lib/videoThumbnail.test.ts left in tree.
CONFLICT (modify/delete): convex/lib/videoPreview.test.ts deleted in Updated upstream and modified in Stashed changes. 
Version Stashed changes of convex/lib/videoPreview.test.ts left in tree.
CONFLICT (modify/delete): convex/lib/subscription.test.ts deleted in Updated upstream and modified in Stashed changes. 
Version Stashed changes of convex/lib/subscription.test.ts left in tree.
CONFLICT (modify/delete): convex/lib/providerHealthFunctions.test.ts deleted in Updated upstream and modified in Stashed changes. Version Stashed changes of convex/lib/providerHealthFunctions.test.ts left in tree.
CONFLICT (modify/delete): convex/lib/openrouter.test.ts deleted in Updated upstream and modified in Stashed changes. Version Stashed changes of convex/lib/openrouter.test.ts left in tree.
CONFLICT (modify/delete): convex/lib/groq.test.ts deleted in Updated upstream and modified in Stashed changes. Version 
Stashed changes of convex/lib/groq.test.ts left in tree.
CONFLICT (modify/delete): convex/http.test.ts deleted in Updated upstream and modified in Stashed changes. Version Stashed changes of convex/http.test.ts left in tree.
CONFLICT (modify/delete): convex/generatedImages.test.ts deleted in Updated upstream and modified in Stashed changes. Version Stashed changes of convex/generatedImages.test.ts left in tree.
CONFLICT (modify/delete): convex/follows.test.ts deleted in Updated upstream and modified in Stashed changes. Version Stashed changes of convex/follows.test.ts left in tree.
CONFLICT (modify/delete): convex/favorites.test.ts deleted in Updated upstream and modified in Stashed changes. Version Stashed changes of convex/favorites.test.ts left in tree.
CONFLICT (modify/delete): convex/crons.test.ts deleted in Updated upstream and modified in Stashed changes. Version Stashed changes of convex/crons.test.ts left in tree.
CONFLICT (modify/delete): convex/batchProcessor.test.ts deleted in Updated upstream and modified in Stashed changes. Version Stashed changes of convex/batchProcessor.test.ts left in tree.
The stash entry is kept in case you need it again.
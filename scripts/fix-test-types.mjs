#!/usr/bin/env node
/**
 * Script to fix common TypeScript linting errors in test files
 */

import fs from 'fs';

// List of test files to fix (from lint output)
const testFiles = [
  'convex/favorites.test.ts',
  'convex/follows.test.ts',
  'convex/generatedImages.test.ts',
  'convex/http.test.ts',
  'convex/lib/providerHealthFunctions.test.ts',
  'convex/lib/subscription.test.ts',
  'convex/lib/videoPreview.test.ts',
  'convex/lib/videoThumbnail.test.ts',
  'convex/orphanCleanup.test.ts',
  'convex/orphanCleanupQueries.test.ts',
  'convex/promptInference.test.ts',
  'convex/promptLibrary.test.ts',
  'convex/referenceImages.test.ts',
  'convex/sensitivityMigration.test.ts',
  'convex/singleGeneration.test.ts',
  'convex/singleGenerationProcessor.test.ts',
  'convex/stripe.test.ts',
  'convex/thumbnailMigration.test.ts',
  'convex/thumbnailMigrationActions.test.ts',
  'convex/users.test.ts',
  'hooks/mutations/use-set-visibility.test.tsx',
  'hooks/queries/use-batch-generation.test.ts',
  'hooks/use-prompt-library-form.test.ts',
  'hooks/use-smart-video.test.tsx',
  'lib/errors/toast-errors.test.ts',
  'lib/storage/r2-client.test.ts',
];

function fixFile(filePath) {
  console.warn(`Fixing ${filePath}...`);
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Replace @ts-ignore with @ts-expect-error
  if (content.includes('@ts-ignore')) {
    content = content.replace(/@ts-ignore/g, '@ts-expect-error');
    modified = true;
  }

  // Fix common mock patterns - replace `: any` with proper types in mocks
  const mockPatterns = [
    // Mock context
    { from: /let mockCtx: any;/g, to: 'let mockCtx: { runMutation: ReturnType<typeof vi.fn>; runQuery: ReturnType<typeof vi.fn>; };' },
    { from: /const mockCtx: any =/g, to: 'const mockCtx: { runMutation: ReturnType<typeof vi.fn>; runQuery: ReturnType<typeof vi.fn>; } =' },
    
    // Mock functions with any parameters
    { from: /\(config: any\)/g, to: '(config: { handler: (...args: unknown[]) => unknown })' },
    { from: /\(props: any\)/g, to: '(props: Record<string, unknown>)' },
    { from: /\(name: any\)/g, to: '(name: string)' },
    { from: /\(status: any\)/g, to: '(status: number)' },
    { from: /\(err: any\)/g, to: '(err: Error)' },
    { from: /\(error: any\)/g, to: '(error: Error)' },
    
    // ID types - add import if needed
    { from: / as any as Id</g, to: ' as unknown as Id<' },
    { from: /"[^"]+_id" as any/g, to: (match) => match.replace(' as any', ' as unknown as Id<"generatedImages">') },
  ];

  mockPatterns.forEach(({ from, to }) => {
    if (content.match(from)) {
      content = content.replace(from, to);
      modified = true;
    }
  });

  // Add Id import for convex files if needed
  if (filePath.startsWith('convex/') && content.includes('Id<') && !content.includes('import type { Id }')) {
    const importLine = 'import type { Id } from "./_generated/dataModel";';
    // Add after other imports
    const lines = content.split('\n');
    const lastImportIndex = lines.findLastIndex(line => line.startsWith('import '));
    if (lastImportIndex >= 0) {
      lines.splice(lastImportIndex + 1, 0, importLine);
      content = lines.join('\n');
      modified = true;
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.warn(`  ✓ Fixed ${filePath}`);
  } else {
    console.warn(`  - No changes needed for ${filePath}`);
  }
}

// Process all files
testFiles.forEach(fixFile);

console.warn('\nDone!');

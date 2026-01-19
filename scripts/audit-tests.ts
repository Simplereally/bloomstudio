#!/usr/bin/env bun
/**
 * Test Coverage Audit Script
 *
 * Scans the codebase for TypeScript files without corresponding test files.
 * Generates a markdown report with categorized results and statistics.
 *
 * Usage: bun run scripts/audit-tests.ts
 * Output: untested-files.md (destroyed and recreated on each run)
 */

import { readdir, stat, unlink, access } from "fs/promises";
import { join, extname, basename, relative, dirname, normalize } from "path";

// ============================================================================
// Configuration
// ============================================================================

/** Directories to completely ignore during scanning */
const IGNORE_DIRS = new Set([
  ".next",
  "node_modules",
  ".git",
  ".vercel",
  ".agent",
  "public",
  "dist",
  "_generated",
  "temp",
  "coverage",
  ".turbo",
]);

/** File patterns that indicate a test file */
const TEST_PATTERNS = [".test.ts", ".test.tsx", ".spec.ts", ".spec.tsx"];

/** Source file extensions to check */
const SOURCE_EXTENSIONS = [".ts", ".tsx"];

/** Files to always exclude (config, setup, type definitions) */
const EXCLUDE_FILE_PATTERNS = [
  /\.d\.ts$/,           // Type definitions
  /\.config\./,         // Config files (vitest.config, next.config, etc.)
  /vitest\.setup\./,    // Test setup files
  /middleware\.ts$/,    // Next.js middleware
  /instrumentation\./,  // Next.js instrumentation
];

/** Directories containing shadcn/ui components (external, no tests needed) */
const SHADCN_UI_PATH = join("components", "ui");

/** Known shadcn/ui components to exclude */
const SHADCN_COMPONENTS = new Set([
  "accordion.tsx", "alert-dialog.tsx", "alert.tsx", "aspect-ratio.tsx",
  "avatar.tsx", "badge.tsx", "breadcrumb.tsx", "button.tsx", "calendar.tsx",
  "card.tsx", "carousel.tsx", "chart.tsx", "checkbox.tsx", "collapsible.tsx",
  "command.tsx", "context-menu.tsx", "dialog.tsx", "drawer.tsx",
  "dropdown-menu.tsx", "form.tsx", "hover-card.tsx", "input-otp.tsx",
  "input.tsx", "label.tsx", "menubar.tsx", "navigation-menu.tsx",
  "pagination.tsx", "popover.tsx", "progress.tsx", "radio-group.tsx",
  "resizable.tsx", "scroll-area.tsx", "select.tsx", "separator.tsx",
  "sheet.tsx", "sidebar.tsx", "skeleton.tsx", "slider.tsx", "sonner.tsx",
  "switch.tsx", "table.tsx", "tabs.tsx", "textarea.tsx", "toggle-group.tsx",
  "toggle.tsx", "tooltip.tsx",
]);

/** Category definitions for prioritized reporting */
const CATEGORIES: Record<string, { pattern: RegExp; priority: number; description: string }> = {
  "Convex Functions": { pattern: /^convex[/\\](?!lib|_generated)/, priority: 1, description: "Backend mutations, queries, and actions" },
  "Convex Libraries": { pattern: /^convex[/\\]lib/, priority: 2, description: "Shared Convex utilities" },
  "Hooks": { pattern: /^hooks[/\\]/, priority: 3, description: "Custom React hooks" },
  "Lib Utilities": { pattern: /^lib[/\\]/, priority: 4, description: "Core utility functions" },
  "Studio Components": { pattern: /^components[/\\]studio/, priority: 5, description: "Studio page components" },
  "Gallery Components": { pattern: /^components[/\\]gallery/, priority: 6, description: "Gallery and image components" },
  "UI Components": { pattern: /^components[/\\]ui/, priority: 7, description: "Reusable UI primitives" },
  "Other Components": { pattern: /^components[/\\]/, priority: 8, description: "Other component files" },
  "App Routes": { pattern: /^app[/\\]/, priority: 9, description: "Next.js pages and server actions" },
  "Scripts": { pattern: /^scripts[/\\]/, priority: 10, description: "Build and utility scripts" },
  "Types": { pattern: /^types[/\\]/, priority: 11, description: "TypeScript type definitions" },
  "Other": { pattern: /.*/, priority: 99, description: "Uncategorized files" },
};

const OUTPUT_FILE = "untested-files.md";

// ============================================================================
// Core Logic
// ============================================================================

interface FileInfo {
  path: string;
  relativePath: string;
  directory: string;
  filename: string;
}

interface CategoryResult {
  name: string;
  description: string;
  priority: number;
  files: FileInfo[];
}

/**
 * Recursively collect all files from a directory
 */
async function collectFiles(dir: string, files: string[] = []): Promise<string[]> {
  const entries = await readdir(dir);

  for (const entry of entries) {
    if (IGNORE_DIRS.has(entry)) continue;

    const fullPath = join(dir, entry);
    const stats = await stat(fullPath);

    if (stats.isDirectory()) {
      await collectFiles(fullPath, files);
    } else {
      files.push(normalize(fullPath));
    }
  }

  return files;
}

/**
 * Check if a file should be excluded from the audit
 */
function shouldExcludeFile(filePath: string, filename: string): boolean {
  // Exclude by pattern
  for (const pattern of EXCLUDE_FILE_PATTERNS) {
    if (pattern.test(filename)) return true;
  }

  // Exclude shadcn/ui components
  if (filePath.includes(SHADCN_UI_PATH) && SHADCN_COMPONENTS.has(filename)) {
    return true;
  }

  // Exclude index.ts barrel exports (optional - they typically just re-export)
  // Uncomment if you want to exclude barrel files:
  // if (filename === "index.ts" || filename === "index.tsx") return true;

  return false;
}

/**
 * Check if a file is a test file
 */
function isTestFile(filePath: string): boolean {
  return TEST_PATTERNS.some((pattern) => filePath.endsWith(pattern));
}

/**
 * Check if a file is a source file we care about
 */
function isSourceFile(filePath: string): boolean {
  const ext = extname(filePath);
  return SOURCE_EXTENSIONS.includes(ext) && !isTestFile(filePath);
}

/**
 * Find the corresponding test file path for a source file
 */
function getTestFilePaths(sourceFile: string): string[] {
  const ext = extname(sourceFile);
  const baseWithoutExt = sourceFile.slice(0, -ext.length);

  return TEST_PATTERNS.map((pattern) => baseWithoutExt + pattern);
}

/**
 * Categorize a file based on its path
 */
function categorizeFile(relativePath: string): string {
  for (const [name, config] of Object.entries(CATEGORIES)) {
    if (config.pattern.test(relativePath)) {
      return name;
    }
  }
  return "Other";
}

/**
 * Generate the markdown report
 */
function generateReport(
  categories: Map<string, CategoryResult>,
  totalSource: number,
  testedCount: number,
  untestedCount: number
): string {
  const coveragePercent = totalSource > 0 ? ((testedCount / totalSource) * 100).toFixed(1) : "0.0";
  const timestamp = new Date().toISOString();

  let md = `# 📋 Test Coverage Audit

> **Generated:** ${timestamp}

---

## 📊 Summary

| Metric | Count |
|--------|-------|
| **Total Source Files** | ${totalSource} |
| **With Tests** | ${testedCount} ✅ |
| **Without Tests** | ${untestedCount} ❌ |
| **Coverage** | **${coveragePercent}%** |

---

## 🎯 Untested Files by Category

`;

  // Sort categories by priority
  const sortedCategories = [...categories.values()]
    .filter((cat) => cat.files.length > 0)
    .sort((a, b) => a.priority - b.priority);

  for (const category of sortedCategories) {
    md += `### ${category.name} (${category.files.length} files)\n`;
    md += `> ${category.description}\n\n`;

    // Group by directory within category
    const byDir = new Map<string, FileInfo[]>();
    for (const file of category.files) {
      const dir = file.directory || ".";
      if (!byDir.has(dir)) byDir.set(dir, []);
      byDir.get(dir)!.push(file);
    }

    const sortedDirs = [...byDir.keys()].sort();
    for (const dir of sortedDirs) {
      const files = byDir.get(dir)!.sort((a, b) => a.filename.localeCompare(b.filename));
      md += `**\`${dir}/\`**\n`;
      for (const file of files) {
        md += `- [ ] \`${file.filename}\`\n`;
      }
      md += "\n";
    }
  }

  md += `---

## ℹ️ Notes

- **Excluded:** Config files, \`.d.ts\` definitions, shadcn/ui components, test setup files
- **Test patterns recognized:** \`.test.ts\`, \`.test.tsx\`, \`.spec.ts\`, \`.spec.tsx\`
- Checkbox format allows tracking progress in markdown editors
`;

  return md;
}

// ============================================================================
// Main Execution
// ============================================================================

async function main() {
  console.log("🔍 Starting test coverage audit...\n");

  const rootDir = process.cwd();
  const outputPath = join(rootDir, OUTPUT_FILE);

  // Step 1: Delete existing report if it exists
  try {
    await access(outputPath);
    await unlink(outputPath);
    console.log(`🗑️  Deleted existing ${OUTPUT_FILE}`);
  } catch {
    // File doesn't exist, that's fine
  }

  // Step 2: Collect all files
  console.log("📂 Scanning directory tree...");
  const allFiles = await collectFiles(rootDir);
  console.log(`   Found ${allFiles.length} total files`);

  // Step 3: Separate source and test files
  const sourceFiles: FileInfo[] = [];
  const testFileSet = new Set<string>();

  for (const filePath of allFiles) {
    if (isTestFile(filePath)) {
      testFileSet.add(filePath);
    } else if (isSourceFile(filePath)) {
      const relativePath = relative(rootDir, filePath);
      const filename = basename(filePath);

      if (!shouldExcludeFile(relativePath, filename)) {
        sourceFiles.push({
          path: filePath,
          relativePath,
          directory: dirname(relativePath),
          filename,
        });
      }
    }
  }

  console.log(`   ${sourceFiles.length} source files to check`);
  console.log(`   ${testFileSet.size} test files found`);

  // Step 4: Find untested files
  console.log("\n🧪 Checking for missing tests...");

  const categories = new Map<string, CategoryResult>();

  // Initialize categories
  for (const [name, config] of Object.entries(CATEGORIES)) {
    categories.set(name, {
      name,
      description: config.description,
      priority: config.priority,
      files: [],
    });
  }

  let testedCount = 0;
  let untestedCount = 0;

  for (const file of sourceFiles) {
    const testPaths = getTestFilePaths(file.path);
    const hasTest = testPaths.some((testPath) => testFileSet.has(testPath));

    if (hasTest) {
      testedCount++;
    } else {
      untestedCount++;
      const categoryName = categorizeFile(file.relativePath);
      categories.get(categoryName)!.files.push(file);
    }
  }

  // Step 5: Generate and write report
  console.log("\n📝 Generating report...");
  const report = generateReport(categories, sourceFiles.length, testedCount, untestedCount);
  await Bun.write(outputPath, report);

  // Step 6: Print summary
  const coveragePercent = sourceFiles.length > 0
    ? ((testedCount / sourceFiles.length) * 100).toFixed(1)
    : "0.0";

  console.log(`
✅ Audit complete!

📊 Results:
   Total source files: ${sourceFiles.length}
   With tests:         ${testedCount} ✅
   Without tests:      ${untestedCount} ❌
   Coverage:           ${coveragePercent}%

📄 Report written to: ${OUTPUT_FILE}
`);
}

main().catch((err) => {
  console.error("❌ Audit failed:", err);
  process.exit(1);
});

import { readdir, stat } from "fs/promises";
import { join, extname, basename, relative, dirname, normalize } from "path";

const IGNORE_DIRS = new Set([
  ".next",
  "node_modules",
  ".git",
  ".vercel",
  "public",
  "dist",
  "_generated",
  "temp",
]);

const TEST_EXTENSIONS = [".test.ts", ".test.tsx", ".spec.ts", ".spec.tsx"];
const SOURCE_EXTENSIONS = [".ts", ".tsx"];

const SHADCN_COMPONENTS = new Set([
  "accordion.tsx",
  "alert-dialog.tsx",
  "alert.tsx",
  "aspect-ratio.tsx",
  "avatar.tsx",
  "badge.tsx",
  "breadcrumb.tsx",
  "button.tsx",
  "calendar.tsx",
  "card.tsx",
  "carousel.tsx",
  "chart.tsx",
  "checkbox.tsx",
  "collapsible.tsx",
  "command.tsx",
  "context-menu.tsx",
  "dialog.tsx",
  "drawer.tsx",
  "dropdown-menu.tsx",
  "form.tsx",
  "hover-card.tsx",
  "input-otp.tsx",
  "input.tsx",
  "label.tsx",
  "menubar.tsx",
  "navigation-menu.tsx",
  "pagination.tsx",
  "popover.tsx",
  "progress.tsx",
  "radio-group.tsx",
  "resizable.tsx",
  "scroll-area.tsx",
  "select.tsx",
  "separator.tsx",
  "sheet.tsx",
  "sidebar.tsx",
  "skeleton.tsx",
  "slider.tsx",
  "sonner.tsx",
  "switch.tsx",
  "table.tsx",
  "tabs.tsx",
  "textarea.tsx",
  "toggle-group.tsx",
  "toggle.tsx",
  "tooltip.tsx",
]);

async function getFiles(dir: string, allFiles: string[] = []) {
  const files = await readdir(dir);
  for (const file of files) {
    const path = join(dir, file);
    if (IGNORE_DIRS.has(file)) continue;

    const stats = await stat(path);
    if (stats.isDirectory()) {
      await getFiles(path, allFiles);
    } else {
      allFiles.push(path);
    }
  }
  return allFiles;
}

async function runAudit() {
  const rootDir = process.cwd();
  const allFiles = (await getFiles(rootDir)).map((f) => normalize(f));

  const sourceFiles = allFiles.filter((file) => {
    const ext = extname(file);
    const base = basename(file);
    // Ignore config files and definition files
    if (base.includes("config.") || base.endsWith(".d.ts")) return false;
    // Ignore internal convex files
    if (file.includes(join("convex", "_generated"))) return false;

    // Ignore shadcn components
    if (file.includes(join("components", "ui")) && SHADCN_COMPONENTS.has(base)) return false;

    return SOURCE_EXTENSIONS.includes(ext) && !TEST_EXTENSIONS.some(tExt => file.endsWith(tExt));
  });

  const testFiles = new Set(allFiles.filter((file) =>
    TEST_EXTENSIONS.some(tExt => file.endsWith(tExt))
  ));

  const untested: Record<string, string[]> = {};

  for (const sourceFile of sourceFiles) {
    const ext = extname(sourceFile);
    const baseWithoutExt = sourceFile.slice(0, -ext.length);

    const hasTest = TEST_EXTENSIONS.some(tExt => testFiles.has(baseWithoutExt + tExt));

    if (!hasTest) {
      const relPath = relative(rootDir, sourceFile);
      const dir = dirname(relPath);
      if (!untested[dir]) untested[dir] = [];
      untested[dir].push(basename(sourceFile));
    }
  }

  let output = "# Untested TypeScript Files Audit\n\n";
  output += `Generated on: ${new Date().toISOString()}\n\n`;

  const sortedDirs = Object.keys(untested).sort();
  for (const dir of sortedDirs) {
    output += `## ${dir}\n`;
    for (const file of untested[dir].sort()) {
      output += `- [ ] ${file}\n`;
    }
    output += "\n";
  }

  await Bun.write("untested-files.md", output);
  console.log("Audit complete. Results written to untested-files.md");
}

runAudit().catch(console.error);

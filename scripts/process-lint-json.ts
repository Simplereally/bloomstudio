import * as fs from "fs";
import * as path from "path";

interface LintMessage {
  ruleId: string | null;
  severity: number;
  message: string;
  line: number;
  column: number;
}

interface LintResult {
  filePath: string;
  messages: LintMessage[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isLintMessage(value: unknown): value is LintMessage {
  return (
    isRecord(value) &&
    (typeof value.ruleId === "string" || value.ruleId === null) &&
    typeof value.severity === "number" &&
    typeof value.message === "string" &&
    typeof value.line === "number" &&
    typeof value.column === "number"
  );
}

function isLintResult(value: unknown): value is LintResult {
  return (
    isRecord(value) &&
    typeof value.filePath === "string" &&
    Array.isArray(value.messages) &&
    value.messages.every(isLintMessage)
  );
}

function parseJson(text: string): unknown | null {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

const main = () => {
  const reportPath = path.resolve("lint_results.json");
  const outputDir = path.resolve("lint_reports");

  if (!fs.existsSync(reportPath)) {
    console.error("lint_results.json not found!");
    process.exit(1);
  }

  const rawData = fs.readFileSync(reportPath, "utf-8");
  let results: LintResult[];
  try {
    const parsed = parseJson(rawData);
    if (!parsed || !Array.isArray(parsed) || !parsed.every(isLintResult)) {
      throw new Error("Invalid lint JSON structure");
    }
    results = parsed;
  } catch (e) {
    console.error("Failed to parse JSON:", e);
    process.exit(1);
  }

  // Ensure output directory exists
  if (fs.existsSync(outputDir)) {
    fs.rmSync(outputDir, { recursive: true, force: true });
  }
  fs.mkdirSync(outputDir);

  const errorsByRule: Record<string, string[]> = {};

  results.forEach((result) => {
    // Make path relative for cleaner output
    const relativePath = path.relative(process.cwd(), result.filePath);

    result.messages.forEach((msg) => {
      const ruleIdValue = msg.ruleId ?? "";
      const ruleId = ruleIdValue.length > 0 ? ruleIdValue : "unknown-rule";
      if (!errorsByRule[ruleId]) {
        errorsByRule[ruleId] = [];
      }

      // Format: File:line:col - Message
      const line = `${relativePath}:${msg.line}:${msg.column} - ${msg.message}`;
      errorsByRule[ruleId].push(line);
    });
  });

  // Write files
  Object.keys(errorsByRule).forEach((ruleId) => {
    const lines = errorsByRule[ruleId];
    const safeRuleId = ruleId.replace(/\//g, "__"); // Replace / with __ for filenames
    const filePath = path.join(outputDir, `${safeRuleId}.txt`);

    const content = `Rule: ${ruleId}\nTotal Errors: ${lines.length}\n\n` + lines.join("\n");
    fs.writeFileSync(filePath, content);
    console.warn(`Created ${filePath} (${lines.length} errors)`);
  });

  console.warn(`\nProcessing complete. Reports generated in ${outputDir}`);
};

main();

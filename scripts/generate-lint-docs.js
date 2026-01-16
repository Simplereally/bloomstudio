
async function main() {
  const fs = await import("node:fs")
  const path = await import("node:path")

  const data = JSON.parse(fs.readFileSync("lint-errors.json", "utf8"))

  const stories = [
  {
    name: 'Lint Cleanup Story 1: UI Foundation & Layout',
    id: 'lint-001-ui-foundation',
    matcher: (relPath) => relPath.startsWith('components\\ui\\') || 
                         relPath.startsWith('components\\layout\\') || 
                         relPath.startsWith('components\\providers\\') ||
                         relPath.startsWith('components/ui/') || 
                         relPath.startsWith('components/layout/') || 
                         relPath.startsWith('components/providers/'),
    errors: []
  },
  {
    name: 'Lint Cleanup Story 2: Image & Studio Features',
    id: 'lint-002-image-studio',
    matcher: (relPath) => relPath.startsWith('components\\studio\\') || 
                         relPath.startsWith('components\\images\\') || 
                         relPath.startsWith('components\\image-generator\\') || 
                         relPath.startsWith('components\\gallery\\') ||
                         relPath.startsWith('components/studio/') || 
                         relPath.startsWith('components/images/') || 
                         relPath.startsWith('components/image-generator/') || 
                         relPath.startsWith('components/gallery/'),
    errors: []
  },
  {
    name: 'Lint Cleanup Story 3: Profile, Settings & Pricing',
    id: 'lint-003-profile-settings',
    matcher: (relPath) => relPath.startsWith('components\\profile\\') || 
                         relPath.startsWith('components\\settings\\') || 
                         relPath.startsWith('components\\subscription\\') || 
                         relPath.startsWith('components\\pricing\\') ||
                         relPath.startsWith('components/profile/') || 
                         relPath.startsWith('components/settings/') || 
                         relPath.startsWith('components/subscription/') || 
                         relPath.startsWith('components/pricing/'),
    errors: []
  },
  {
    name: 'Lint Cleanup Story 4: Core Logic, Hooks & Backend',
    id: 'lint-004-core-logic',
    matcher: (relPath) => relPath.startsWith('hooks\\') || 
                         relPath.startsWith('lib\\') || 
                         relPath.startsWith('convex\\') ||
                         relPath.startsWith('hooks/') || 
                         relPath.startsWith('lib/') || 
                         relPath.startsWith('convex/'),
    errors: []
  },
  {
    name: 'Lint Cleanup Story 5: Application Routes & Pages',
    id: 'lint-005-app-routes',
    matcher: (relPath) => relPath.startsWith('app\\') || relPath.startsWith('app/'),
    errors: []
  },
  {
    name: 'Lint Cleanup Story 6: Miscellaneous Root Files',
    id: 'lint-006-misc',
    matcher: () => true, // Catch-all
    errors: []
  }
  ];

  data.forEach((file) => {
    if (file.messages.length === 0) return
    const relPath = path.relative(process.cwd(), file.filePath)

    const story = stories.find((s) => s.matcher(relPath))
    if (story) {
      story.errors.push({
        file: relPath,
        messages: file.messages,
      })
    }
  })

  const cleanupDir = "todo/lint-cleanup"
  if (fs.existsSync(cleanupDir)) {
    fs.rmSync(cleanupDir, { recursive: true, force: true })
  }
  fs.mkdirSync(cleanupDir, { recursive: true })

  const indexContent = [`# Lint Cleanup Plan

This document outlines the plan to address approximately 300 ESLint errors in the codebase.
Errors have been batched into logical "stories" to make cleanup manageable.

## Stories Index
`];

  stories.forEach((story) => {
    if (story.errors.length === 0) return

    const totalErrors = story.errors.reduce((acc, f) => acc + f.messages.length, 0)
    indexContent.push(`- [ ] [${story.name}](./${story.id}.md) (${totalErrors} errors)`)

    let storyMarkdown = `# ${story.name}\n\n`
    storyMarkdown += `Total Errors: ${totalErrors}\n\n`

    storyMarkdown += `## Verification Commands\n`
    storyMarkdown += `Run these commands to verify your changes for this story without checking the entire repo:\n\n`

    const filePaths = story.errors.map((f) => `"${f.file}"`).join(" ")
    storyMarkdown += `### Lint\n\`\`\`bash\nbunx eslint ${filePaths}\n\`\`\`\n\n`

    storyMarkdown += `### Type Check\n\`\`\`bash\nbunx tsc --noEmit ${filePaths.replace(/\\\\/g, "/")}\n\`\`\`\n\n`

    storyMarkdown += `---\n\n`

    story.errors.forEach((fileError) => {
      storyMarkdown += `## \`${fileError.file}\`\n`
      fileError.messages.forEach((msg) => {
        const severity = msg.severity === 2 ? "Error" : "Warning"
        storyMarkdown += `- [ ] Line ${msg.line}: **${severity}** (${msg.ruleId}) - ${msg.message}\n`
      })
      storyMarkdown += "\n"
    })

    fs.writeFileSync(path.join(cleanupDir, `${story.id}.md`), storyMarkdown)
  })

  fs.writeFileSync(path.join(cleanupDir, "INDEX.md"), indexContent.join("\n"))
  console.log("Successfully generated lint cleanup documents in todo/lint-cleanup/")
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})

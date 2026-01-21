They basically treat a `SKILL.md` as “how I, a senior, would reliably do X in this repo” written down in a way a model can’t misunderstand.

Under the Agent Skills standard, a skill is a folder with a `SKILL.md` that packages metadata + instructions + optional scripts/resources, and the agent learns “when” and “how” to use it. ([Agent Skills][1]) Claude Code, Codex CLI, etc. then auto-load those skills and apply them whenever the description matches the task. ([OpenAI Developers][2])

Let’s talk about the mindset and then the concrete approach.

---

## Mindset: how seniors think about skills

### 1. Skills as “frozen workflows”, not magic prompts

Senior devs don’t think “let’s give the agent more creativity.” They think:

> “What exact steps do I follow when I do this manually, and how can I encode that so the agent can’t skip or improvise the dangerous parts?”

So each skill is:

* **Narrow** – “Add a REST endpoint in service X” rather than “build backend stuff”.
* **Deterministic** – same inputs → same general flow.
* **Opinionated** – it encodes team conventions, not generic best practices.

This matches your observation: they already have strong priors on what “correct” looks like, so the skill just automates that workflow.

---

### 2. Skills as extensions of *their* judgment, not a replacement

They assume:

* *The model is good at pattern matching + glue code.*
* *The human is still the arbiter of architecture, tradeoffs, and ‘is this actually safe?’*

So the skill:

* **Pushes verification work onto the agent** (`rg`, tests, linters, typechecks, reading related files).
* **Surfaces artifacts for the human** (summaries, diffs, checklists) so review is fast and high-signal.

The senior’s job becomes designing the skill so that, when they skim the output, it already feels like something they might have written.

---

### 3. Skills as small, composable “lego blocks”

Modern agent stacks treat skills as modular capabilities: each skill is a specialist (e.g. “write tests for an existing change”, “migrate a DB column”, “update API docs”). ([Claude Developer Platform][3])

With 10–20 terminals going, you’re usually seeing some combination of:

* Different **repos/services** each with their own local skills.
* Different **modes** in the same repo – exploration, refactor, test-writing, PR-prepping, migration, etc.
* Agents that **chain skills** (e.g. “code search skill → refactor skill → test skill → PR skill”).

Seniors design skills assuming they’ll be composed like this, so each one has a clear contract and narrow surface area.

---

## Approach: how to actually craft a SKILL.md

The Agent Skills spec itself pushes you toward “progressive disclosure”: short metadata; more detailed instructions when the skill is activated; deeper resources/scripts only when needed. ([Agent Skills][1]) Good authors lean into that.

Here’s how they typically approach it.

---

### Step 1: Start from a real workflow you already do well

Pick something you do often and consistently:

* “Add a new feature flag.”
* “Add a REST endpoint and wire it through to the frontend.”
* “Fix a bug and add regression tests.”
* “Do a PR review using our standards.”

Then ask: *If I had to explain this to a sharp but junior dev so they can’t mess it up, what would I write?*
That text is your raw material for `SKILL.md`.

---

### Step 2: Define a crisp contract in the metadata

In the frontmatter / metadata block, good skills are ruthless about:

* **Name** – specific, action-oriented (e.g. `create-rest-endpoint`, `typescript-api-refactor`).
* **Description / when to use** – 2–3 lines that let the agent route correctly:

  * What it does.
  * What it *doesn’t* do.
  * Key constraints (language, framework, repo assumptions).
* **Inputs & outputs** – what the agent should expect and what it must produce:

  * “Input: a description of the new endpoint and existing route file.”
  * “Output: code changes applied + updated tests + brief summary.”

This makes the skill easy for the agent to discover and for your future self to understand.

---

### Step 3: Encode your algorithm, not vibes

In the `SKILL.md` body, seniors write an **algorithm**, not just “best practices”:

Instead of:

> “Follow REST best practices and add tests.”

They write something closer to:

1. Locate the main router file in `src/api/routes/*.ts`.
2. Identify the module that matches the feature area. If unclear, ask the user which module to extend before continuing.
3. Add a new route handler that:

   * Accepts `X` and `Y` parameters.
   * Validates inputs using `zod` schemas from `src/api/schemas`.
   * Calls the existing service function or creates a new one if needed.
4. Update or create tests:

   * Use `jest` in `__tests__/api`.
   * For new handlers, add at least one happy-path and one failure-path test.
5. Run `npm test -- <matching test file>` and include the output. If tests fail, fix them before returning.
6. In your final response:

   * Summarize the changes.
   * Paste the relevant diffs.
   * Note any TODOs or follow-up questions.

Key patterns:

* **Checklists** – reduce ambiguity.
* **Conditionals** – “if schema doesn’t exist, create it here”.
* **Explicit commands** – tell the agent what shell commands / tools to run.
* **Forced verification** – tests, builds, searches must be run, not “suggested”.

You’re basically teaching the agent your **internal SOP**.

---

### Step 4: Bake in codebase-specific context

Skills shine when they encode things a generic model doesn’t know:

* **Directory structure & naming** – “React components live in `src/components`, tests in `src/components/__tests__`.”
* **Conventions** – “Use our `useApi` hook, don’t call `fetch` directly.”
* **Safety rules** – “Never write raw SQL; always use the query builder in `db/queries.ts`.”
* **Edge cases** – “This service is multi-tenant; never assume a single org. Always pass `tenantId` through.”

This is where high-skill engineers get a lot of leverage: they know the sharp edges and encode that knowledge so the agent avoids them.

---

### Step 5: Guardrails: when *not* to use the skill & how to fail

Senior authors are explicit about **non-goals** and failure modes:

* “Do not use this skill for database schema changes; use `db-migration.skill` instead.”
* “If the project doesn’t appear to be TypeScript/React, stop and ask the user.”
* “If running tests or `npm run lint` fails for reasons unrelated to your changes, report that and stop instead of trying to fix the whole repo.”

This stops the model from over-extending and doing heroic (dangerous) things.

---

### Step 6: Specify output format for fast human review

They optimize the skill for **their own review loop**:

* Structured final output:

  * `## Summary`
  * `## Files changed`
  * `## Diffs`
  * `## Tests`
* Clear markers of confidence:

  * “All tests passed ✅” vs. “Tests failing ❌ – needs human follow-up.”
* Call out open questions, TODOs, and assumptions.

Remember your earlier point: seniors are fast at verification. A good skill hands them exactly the evidence they need.

---

### Step 7: Iterate like code, not like a one-off prompt

The good ones treat skills as **versioned artifacts**:

* They run the skill in real work.
* When the agent misbehaves or gets stuck, they:

  * Add a clarifying step.
  * Tighten a heuristic (“always search for existing examples before creating a new pattern”).
  * Split a too-broad skill into two narrower ones.

The SKILL.md becomes a living document of what’s currently “the right way” to do a task in that codebase.

---

## How this plays with 10–20 terminals and deep stacks

When you see someone with an army of terminals, imagine something like:

* Terminal 1-3: repo A (backend), with:

  * `bugfix.skill`
  * `api-endpoint.skill`
  * `db-migration.skill`
* Terminal 4-6: repo B (frontend), with:

  * `ui-component.skill`
  * `accessibility-review.skill`
  * `storybook-docs.skill`
* Terminal 7-10: cross-cutting:

  * `pr-review.skill`
  * `commit-message.skill`
  * `changelog-update.skill`
  * `perf-investigation.skill`

Each skill is **surgical**. The senior knows which combination to invoke for a given problem, and the skills themselves encode how to interact with tests, linters, and the project’s layout.

---

## A short mindset checklist when you’re writing a skill

When you sit down to craft a SKILL.md, think:

1. **What narrow workflow am I capturing?**
   If it’s more than one, split it.
2. **What must be true before/after?**
   Preconditions, invariants, tests.
3. **What exact steps do I follow?**
   Turn that into an algorithm, not prose advice.
4. **What repo-specific traps can I prevent?**
   Hard-won tribal knowledge goes here.
5. **What should the agent show me at the end so I can say “yes” in 10–20 seconds?**
   Shape the output around your review.

That’s the senior-engineer mindset: skills as distilled, reusable engineering judgment. The agents then just become really fast, really obedient juniors running those playbooks for you.

[1]: https://agentskills.io/specification?utm_source=chatgpt.com "Specification - Agent Skills"
[2]: https://developers.openai.com/codex/skills?utm_source=chatgpt.com "Agent Skills - developers.openai.com"
[3]: https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview?utm_source=chatgpt.com "Agent Skills - Claude Docs"

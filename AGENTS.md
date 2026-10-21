<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

<!-- BEGIN:workflow -->

# Workflow

- When a **big change** lands — a feature, a refactor, or a coherent batch of
  work that is verified (tsc/eslint/tests/build green), not every small edit —
  commit it and **push to `origin/master` right away**. The user wants major
  site changes on their git as soon as they're done, not held back.

<!-- END:workflow -->

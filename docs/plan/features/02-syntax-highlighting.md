# Feature 02 — Syntax highlighting (M2)

Source: features-plan.md §3.1 (M2), US-2.

## Objective
Render fenced code blocks with language-aware syntax highlighting in both the post detail page and
the editor live-preview pane, with a safe fallback to plain monospace when no language is specified.

## Acceptance criteria
- AC1: Fenced code blocks render with language-aware highlighting.
- AC2: Code without a language tag falls back to plain monospace — never breaks rendering.

## Implementation steps
1. The `highlight` boolean in `boilerplate.ejs` (added in feature 01) already loads highlight.js CSS + JS.
   No new deps or CDN changes needed.
2. `views/shared/layouts/boilerplate.ejs`: after the pageScripts block, when `highlight` is true,
   add an inline `<script defer>hljs.highlightAll()</script>` at the body end — one line, no new file.
   Runs after highlight.js and any pageScripts have loaded (all `defer` scripts execute in DOM order).
3. `post.controller.js` `showPost`: add `highlight: true` to the render locals.
   The detail page now gets hljs CSS + JS + `highlightAll()` automatically.
4. `editor.js`: already calls `hljs.highlightElement(el)` on preview code when `window.hljs` is
   available. Confirm it still works now that `highlight: true` is also passed to editor pages
   (it was already — feature 01 loaded hljs on editor pages; no change needed here).
5. No schema/model/service changes.

## Verification
- `node --check` on touched files.
- Live smoke:
  - Post with `\`\`\`js` fenced block → detail HTML contains `<code class="language-js hljs">` and a
    `<span class="hljs-keyword">` (or similar token span) inside the block.
  - Post with a bare fenced block (no language) → still renders `<pre><code>…</code></pre>`, no
    hljs token spans, no crash.
  - Editor preview of the same blocks shows colorized output (highlight loaded on editor pages).
  - All other pages still 200; hex sweep clean.

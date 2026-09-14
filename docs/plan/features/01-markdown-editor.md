# Feature 01 — Markdown editor (M1) + editor prefill (§7.4)

Source: features-plan.md §3.1 (M1), §7 (current scope point 4).

## Objective
Replace the plain `<textarea>` post editor with a markdown editor that has a **toggleable live preview**
and ships **prefilled sample content** on the "write post" page. Introduce the shared server-side
markdown → sanitized-HTML pipeline so post bodies render as styled document HTML instead of one monospace blob.

## User story (US-1) & acceptance criteria
As an author, I want to write posts in markdown with a live preview, so I can format text and code
without fighting a plain textarea.

- AC1: Editor supports headings, bold/italic, links, lists, and fenced code blocks (markdown source).
- AC2: A toggleable live preview shows the rendered output before publishing.
- AC3: Existing posts (plain text) continue to render correctly — no data migration required.
- AC4: The create-post editor opens prefilled with a sample markdown post.

## Implementation steps
1. Deps: `npm i markdown-it sanitize-html`.
2. `utils/markdown.js` — `renderMarkdown(src)`:
   - `markdown-it` with `{ html: false, breaks: true, linkify: true }` (raw HTML in posts is escaped;
     single newlines become `<br>` so legacy plain-text posts keep their shape).
   - Pass output through `sanitize-html` (default safe tags; `a` restricted to http/https/mailto;
     `img` allowed with https/http only, locked `target`/`rel` attributes).
   - Throw-free; callers render escaped markdown source on failure if ever needed.
3. `utils/reading-time.js` — move the existing inline `min read` math from `views/posts/detail.ejs`
   and `views/users/profile.ejs` into `readingMinutes(text)` (words/200, min 1). (Extends across the app in feature 03.)
4. `boilerplate.ejs`:
   - Add optional `pageScripts` block: `<% if (typeof pageScripts !== 'undefined' && pageScripts) { %>`
     looping `<script src="...">` tags, placed before `/index.js`.
   - Add optional `highlight` block (footer) — loaded now for the editor preview, reused by feature 02 for detail pages.
5. `public/editor.js` — editor page behavior:
   - `[data-editor-preview]` toggle swaps editor pane and preview pane.
   - Preview renders the textarea value with the CDN markdown-it build (`window.markdownit`) on each input
     (debounced) and on toggle-open; output goes into a `.post-body` container (color tokens, no sanitizer
     needed client-side — markdown-it escapes raw HTML).
   - Reuse existing `data-pending`/character-counter hooks from `/index.js`.
6. Editor markup (`views/posts/create.ejs` + `views/posts/edit.ejs` — same editor partial if layout diverges):
   - Monospace `<textarea>` as today; below it a "Live preview" toggle button (Editor | Preview) and a preview pane.
   - Create page: `detail` textarea prefilled with a short sample markdown story (inline constant kept in the view —
     clearly demo content so an empty author post doesn't accidentally ship it).
   - Edit page: same toggle; prefill comes from the existing post.
7. `views/posts/detail.ejs`:
   - Replace the `<pre class="code-block">` blob with `<div class="post-body"><%- renderMarkdown(post.detail) %></div>`.
   - Keep title/description/author row, owner edit/delete buttons, and the comments section untouched.
8. `public/style.css` — add a `.post-body` typography block using only `var(--c-*)` tokens:
   headings (per-type sizing), paragraphs, `strong/em/a`, inline `code`, fenced `pre` (term-bg/term-fg/term-border,
   reusing the old `.code-block` look), `blockquote` (brand left border), `ul/ol`, `hr`, `table`.
   `.code-block` class may be removed once nothing references it (grep before deleting).

## Verification
- `node --check` on new/edited JS.
- Live smoke:
  - Create a post with sample markdown incl. `# heading`, `**bold**`, `- list`, fenced ` ```js ` block,
    `> quote`, and a `https://` link → detail page contains `<h1>`, `<strong>`, `<ul>`, `<pre><code>`,
    `<blockquote>`, and `<a href>`; contains no raw `&lt;script&gt;`.
  - Post containing `onerror=alert(1)` inside HTML still renders inert (markdown-it escapes raw HTML).
  - Edit page round-trips markdown unchanged; preview toggle reveals rendered HTML.
  - Legacy-style plain text body renders as paragraphs/brs, no crash.
  - Public pages still 200; hex sweep (`grep -rnE "\[#[0-9A-Fa-f]{3,8}\]" views public/style.css`) is empty.
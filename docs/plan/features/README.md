# Feature implementation — v2 (one release, delivered feature-by-feature)

Source plan: `docs/plan/features-plan.md`
Status: accepted scope for this release (admin anything is intentionally deferred to a later phase).

## Scope decisions (locked)
- **Markdown rendering**: server-side `markdown-it` + `sanitize-html` (readers get HTML without JS; output sanitized).
  `highlight.js` + `markdown-it` are served via CDN on the editor pages only (client-side live preview).
- **Roles**: default user role is `reader`; a user self-promotes to `author` via "Become an author" on their profile.
  Writing posts requires `role === 'author'`. Commenting / liking / bookmarking are open to any logged-in user.
  The `admin` role value is reserved in the enum for the next phase; no admin features ship here.
- **Notifications**: in-app only (no email). Triggers: comment on your post, reply to your comment, like on your post, follow.
- **Drafts**: full support in scope — `status: draft|published`, "Save draft"/"Publish", resume, and background autosave
  via a JSON endpoint that never redirects (title-unique is kept by publishing the saved draft, not creating a duplicate).

## Shared groundwork (consumed by all feature files)
- New deps: `markdown-it`, `sanitize-html`.
- `boilerplate.ejs` gains optional blocks:
  - `highlight` (render-local) → loads highlight.js CSS + JS in the page.
  - `pageScripts` (render-local) → extra script(s) before `/index.js` (e.g. `/editor.js`).
- New utils:
  - `utils/markdown.js` → `renderMarkdown(src)` (markdown-it → sanitize-html).
  - `utils/reading-time.js` → `readingMinutes(text)` (`words / 200`, min 1).
- `config/constants.js` gains `ROLES = { READER: 'reader', AUTHOR: 'author', ADMIN: 'admin' }`.
- Role migration: `db.users.updateMany({ role: 'user' }, { $set: { role: 'reader' } })`.
- Every new color uses the existing `--c-*` theme tokens — no raw hex (dev-rules §1).
- All new inputs validated by Joi at the route boundary. Schemas explicitly declare `tags`, `status`, `action`,
  `parent`, `draftId` fields so `stripUnknown: true` never drops them.
- After each feature: `node --check` all touched JS, targeted live smoke checks, hex sweep still clean.

## Feature file order (build order follows the dependency map)
1. `01-markdown-editor.md` — M1 editor + editor prefill (§7.4) + markdown pipeline.
2. `02-syntax-highlighting.md` — M2 code syntax highlighting.
3. `03-reading-time.md` — C2 reading time estimate.
4. `04-tags.md` — M3 tags/categories + tag listing.
5. `05-roles-and-drafts.md` — M5-lite roles (reader→author) + S1 drafts/autosave.
6. `06-likes-and-views.md` — M6 likes/reactions + C5 view counts.
7. `07-replies-and-related.md` — S2 nested replies + S7 related posts.
8. `08-public-profiles.md` — M4 public author profile + bio.
9. `09-follow-and-bookmarks.md` — S4 follow + C1 bookmarks.
10. `10-in-app-notifications.md` — S3 in-app notifications.
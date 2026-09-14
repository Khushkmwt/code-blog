# Feature 05 — Roles (reader→author) + Drafts/autosave (M5-lite + S1)

Source: features-plan.md US-5 (roles, admin-lite only), S1 (drafts/autosave), §7.3 (self-serve author).

## Objective
- Roles: every user is a `reader` by default and can self-promote to `author` ("Become an author").
  Writing posts requires `role === 'author'`. `admin` value reserved (no admin UI ships — AC3: users
  see no admin controls).
- Drafts: an author can save a post as a draft (not published), resume later, and background-autosave
  a new post via a JSON endpoint that never redirects.

## Acceptance criteria
- AC1 (roles): `role` field on User is `reader|author|admin`, default `reader` (migration for legacy
  `user` values).
- AC2 (roles): post create/update routes are author-gated; non-authors get a clear redirect.
- AC3 (roles): no admin UI anywhere.
- AC1 (drafts): Post has `status: draft|published` (default published).
- AC2 (drafts): "Save draft" / "Publish" on create; editing a draft offers save-draft or publish.
- AC3 (drafts): Background autosave on the create page → `POST /api/v1/post/draft` (JSON, no redirect).
- AC4 (drafts): Only published posts appear in blog/home listings; drafts are viewable only by their
  author (via the edit page); owner profile lists drafts with a status chip.

## Design decisions
- **Title uniqueness vs drafts**: `Post.title` is unique. A new draft therefore requires a non-empty
  title (the client skips autosave until a title exists). This avoids schema/index changes and keeps a
  clean unique constraint. Publishing a saved draft reuses `draftId` and updates that document — it
  never creates a duplicate.
- **Autosave scope**: create page only (new-post safety net). The edit page has explicit "Save draft"
  and "Publish" buttons; no background autosave there.
- **Draft endpoint updates** the existing draft when `draftId` is given (ownership-checked); never
  touches `status` on update.
- `res.locals.user` (from `authenticateUser`) and `req.user` (from `verifyJWT`) both carry the fresh
  role from the DB — no JWT changes needed (tokens are re-read users each request).

## Implementation steps
1. `config/constants.js` — add `ROLES = { READER: 'reader', AUTHOR: 'author', ADMIN: 'admin' }`.
2. `models/user.model.js` — role enum `['reader','author','admin']`, default `'reader'`.
3. Migration: `db.users.updateMany({ role: 'user' }, { $set: { role: 'reader' } })`.
4. `models/post.model.js` — add `status: { type: String, enum: ['draft','published'], default: 'published' }`.
5. `middlewares/auth.middleware.js` — add `requireRole(...roles)` (401 when logged out, 403 otherwise).
6. `schemas/post.schema.js` — `createPostSchema`: add optional `status` (draft/published) + optional
   `draftId` (24-hex ObjectId); `updatePostSchema`: optional `status`; new `draftPostSchema`:
   title required + optional desc/detail/tags/draftId.
7. `services/post.service.js` — `listPosts` forces `status:'published'`; `createPost` publishes an
   existing `draftId` (ownership + update to published) else creates; `updatePost` accepts `status`;
   add `draftPost` (create `status:'draft'` or update by `draftId`, never touching status).
8. `services/page.service.js` — home `latestPosts` + `postsCount` only published.
9. `controllers/post.controller.js` — read `status`/`draftId`, `saveDraft` returns JSON (no redirect);
   `showPost` shows drafts only to their owner (404 otherwise) and passes `isDraft` for a banner.
10. `controllers/user.controller.js` + `services/user.service.js` — `becomeAuthor` (self-serve,
    reader→author, idempotent); profile lists all own posts (drafts flagged) + draftCount.
11. Routes — `post.routes.js`: author-gate create/update POST + GET update; add `.post('/draft')`.
    `user.routes.js`: add `.post('/become-author')`.
12. Views:
    - `navbar.ejs` — show "Write a post" only for authors.
    - `posts/create.ejs` — hidden `draftId`, "Save draft" (JS → JSON endpoint, then redirect to edit)
      + "Publish" submit; autosave status line; title hint when empty.
    - `posts/edit.ejs` — if draft: "Save draft" (status=draft) + "Publish" (status=published); else
      "Save changes". Draft banner chip.
    - `posts/detail.ejs` — draft banner when owner viewing a draft.
    - `users/profile.ejs` — "Become an author" button for readers (in place of "Write a post");
      posts list shows a Draft chip + "Continue editing" for drafts.
13. `public/editor.js` + `public/drafts.js` — autosave plumbing (fetch `/api/v1/post/draft`, store
    postId in hidden input, status line). Small and separate from the preview logic.

## Verification
- `node --check` all touched JS.
- Smoke: register (role reader) → post create forbidden (no "Write" nav; create returns redirect/
  flash) → become-author → create draft → autosave endpoint returns JSON `{postId}` → draft absent
  from blog/home listing → publish draft → appears in blog; edit page buttons per status.
- Grep views for admin UI — none. Migration left hhh333 as reader.
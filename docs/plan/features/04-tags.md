# Feature 04 — Tags / categories (M3)

Source: features-plan.md US-3 (Browse by topic).

## Objective
Posts carry 1..n tags; readers browse by tag via a shareable listing URL that works with existing
search and pagination. Tags also become the input for S7 (related posts) later.

## Acceptance criteria
- AC1: Authors can assign one or more tags when creating/editing a post.
- AC2: Blog listing supports filtering by tag (works alongside existing search).
- AC3: Each tag has its own listing URL (shareable, bookmarkable) → `/api/v1/blog?tag=<tag>`.

## Design
- `Post.tags`: `[String]`, lowercase, dedup'd, max 10 per post, each token `1–30` chars of
  `[a-z0-9-]`. Form input is a plain text field (tags separated by commas or spaces).
- Parsing/normalization happens at the route boundary inside the Joi schema (`custom`), so the
  service only ever sees clean arrays (dev-rules §3, §5).
- Listing: `listPosts({ search, page, tag })` → `tag` adds `{ tags: tag }` to the query and is
  combined with the existing `$or` search. `?tag=` + `?search=` may coexist.
- Tag chips are links to `/api/v1/blog?tag=<tag>`; the filtered listing shows an active-tag chip
  with a clear (×) control; pagination preserves both `search` and `tag`.

## Implementation steps
1. `models/post.model.js` — add `tags: [{ type: String, default: [] }]`.
2. `schemas/post.schema.js` — add `tags` field with a custom normalizer (split on commas/whitespace,
   trim, lowercase, drop empties, dedupe, cap 10). `createPostSchema` defaults to `[]`;
   `updatePostSchema` keeps it optional (omitted = unchanged, empty string = clears).
3. `services/post.service.js` — accept `tags` in `createPost`/`updatePost`; add `tag` to `listPosts`
   query building.
4. `controllers/post.controller.js` — read `req.query.tag`, pass `tag` into `listPosts` and the
   `posts/list` render; pass `tags` into create/update service calls.
5. Views:
   - `views/posts/create.ejs`, `views/posts/edit.ejs` — tags text input (edit shows existing joined).
   - `views/shared/partials/postcard.ejs` — tag chips under the description.
   - `views/posts/list.ejs` — tag filter heading + active-tag chip with clear link; `qs()` carries `tag`.
   - `views/posts/detail.ejs` — tag chips under the post meta.

## Verification
- `node --check` schema/service/controller/model.
- Smoke: create post with mixed-case/comma/space tags; listing `?tag=` narrows; combined
  `?tag=&search=` works; chips link correctly; pagination preserves tag.
- Hex sweep still clean.
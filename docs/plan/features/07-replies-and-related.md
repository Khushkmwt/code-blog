# Feature 07 — Nested comment replies + Related posts (S2 + S7)

Source: features-plan.md S2 (nested replies, one level deep), S7 (related posts by shared tags).

## Objective
Comments can carry a one-level-deep reply thread, so discussion reads naturally without threading
complexity. At the bottom of a post, show up to 3 published related posts sharing its tags.

## Acceptance criteria
- S2-AC1: A comment can be replied to (one level only — replies-to-replies are rejected).
- S2-AC2: Replies render indented under their parent; reply count shown; only logged-in users reply.
- S7-AC1: Posts with ≥1 shared tag appear as "Related" below a post; current post excluded.
- S7-AC2: Any note with no tags → no related section.

## Design
- `Comment.parent`: `ObjectId ref Comment`, default `null`. Top-level = `parent === null`.
- Service rejects `parentId` that is missing, on another post, or itself a reply (nesting cap).
- `getPostById` returns `comments` = top-level (newest first) each enriched with `replies`
  (oldest first) — one read, partitioned in JS.
- Related: find published posts with `tags $in post.tags`, `_id $ne current`, rank by overlap count
  then newest, cap 3.
- Reply form: small form under each comment posting to the existing comment route with a hidden
  `parent` field.

## Implementation steps
1. `models/comment.model.js` — add `parent` (ObjectId ref Comment, default null, index).
2. `schemas/comment.schema.js` — `parent`: Joi 24-hex optional (empty string → undefined).
3. `services/comment.service.js` — `createComment` validates parent (exists, same post, not a reply).
4. `services/post.service.js` — partition comments into top-level + replies in `getPostById`;
   add `getRelatedPosts`.
5. `controllers/post.controller.js` — `showPost` fetches related; passes to view.
6. `views/posts/detail.ejs` — replies block + per-comment Reply form + hidden `parent`;
   "Related posts" grid using `postcard.ejs`.

## Verification
- `node --check` on touched files.
- Smoke: register 3 users, publish 2 posts sharing a tag + 1 unrelated; user1 comments, user2
  replies (renders nested under parent), user3 tries reply-on-reply → 400, reply on other post's
  comment → rejected, anon sees thread but no reply form, related section shows the tagged twin
  (not the unrelated one), tagless note shows no related. Cleanup DB + uploads.
- Hex sweep clean.
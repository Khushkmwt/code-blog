# Feature 06 — Likes + View counts (M6 + C5)

Source: features-plan.md US-6 (likes), C5 (view counts).

## Objective
Logged-in users can like/unlike a post (toggle); like count is visible on the post and in listings;
anonymous users see the count and are prompted to log in. Every page view of a published post bumps a
simple counter (no analytics).

## Acceptance criteria
- AC1: Logged-in users toggle a like on a published post (no duplicate likes).
- AC2: Like count visible on the detail page and in listings (cards / home).
- AC3: Anonymous users see the like count; attempting to like is routed to login.
- AC4 (C5): Published post shows a view count that increments on render.

## Design
- `Post.likes`: `[ObjectId ref=User]` (toggle via `$addToSet`/`$pull`). Count = `likes.length`.
- `Post.views`: `Number` default 0, `$inc` on every successful published detail render.
- Like is a plain form POST → redirect back to the same post (no-JS friendly, matches comment UX).
  Drafts can't be liked (404 the toggle for non-published).
- Detail/like button state: filled heart + "Liked" when current user is in `likes`; outline + "Like"
  otherwise. Logged-out users see the count and the button links to the login page.
- Listings (postcard) show ♥ count + 👁 count as muted stats.

## Implementation steps
1. `models/post.model.js` — add `likes: [ObjectId, ref User, default []]` and `views: Number default 0`.
2. `schemas/post.schema.js` — no change (like id comes from URL; Joi not needed for the toggle).
3. `services/post.service.js` — `toggleLike({ postId, userId })` (404 unless published; `$addToSet`/
   `$pull`; returns `{ liked, likeCount }`). `showPost` view-count bump handled in controller.
4. `controllers/post.controller.js` — `toggleLikePost` (async → redirect `show/:id`); `showPost` inc
   views for published posts (increment once per render via `$inc`).
5. `routes/post.routes.js` — `router.post('/like/:id', verifyJWT, toggleLikePost)`.
6. Views:
   - `views/posts/detail.ejs` — meta row: like form/button (heart icon + count) + views stat.
   - `views/shared/partials/postcard.ejs` — muted ♥/👁 counts row.
7. `config/constants.js` / boilerplate — no color changes (all existing tokens/icons).

## Verification
- `node --check` model/service/controller/routes.
- Smoke: register two users; publish post; user A likes (count 1, stored); A unlikes (0); B likes
  (1); anon sees count but button links to login; view count increments between two views; draft
  cannot be liked; listings show counts. Cleanup DB + uploads.
# Feature 08 — Public author identity (US-4)

Source: features-plan.md US-4.

## Objective
Any visitor can view an author's public profile at a stable URL: avatar, bio, joined date and the
author's published posts. Drafts never appear. Owner retains private controls (bio editing, drafts,
edit/delete, become-author).

## Acceptance criteria
- AC1: Profile viewable by anyone at `/api/v1/users/u/:username` (logged-out fetch returns 200).
- AC2: Shows avatar, bio, joined year, and published posts only.
- AC3: Draft posts never appear on the public profile (they only show on the owner's `/profile`).
- AC4: Owner visiting `/u/:me` is redirected to their owner profile; author names link to `/u/:username`.

## Design
- `User.bio`: `String` default `''`, max 160 chars; editable only by the owner (`POST /api/v1/users/bio`).
- Populate `author` with `name username` so postcards/detail can link to the public profile.
- reuse `views/users/profile.ejs` with an `isOwner` flag; public pass hides email, become-author,
  change-password, Write-a-post, draft chips and Edit/Delete controls; owner pass shows a bio form.

## Implementation steps
1. `models/user.model.js` — `bio: { type: String, default: '', maxlength: 160 }`.
2. `schemas/user.schema.js` — `updateBioSchema` (Joi, trim, max 160, optional).
3. `services/user.service.js` — `getPublicProfile(username)` (404 on missing; published posts only,
   postCount, commentCount, no email/drafts); `updateBio(userId, bio)`.
4. `controllers/user.controller.js` — `showPublicProfile` (if viewer == owner → redirect to
   `/api/v1/users/profile`), `updateBio`.
5. `routes/user.routes.js` — `GET /u/:username`, `POST /bio` (verifyJWT + validate).
6. `views/users/profile.ejs` — `isOwner` param: private vs public header/rows; bio line + bio form.
7. `services/post.service.js`, `services/page.service.js` — populate `'name username'`.
8. `views/shared/partials/postcard.ejs` + `views/posts/detail.ejs` — author chip/name links to
   `/api/v1/users/u/<%= post.author.username %>`.

## Verification
- `node --check` on touched files.
- Smoke: reader registers + becomes author, sets bio, publishes 2 posts + 1 draft; anon GETs
  `/api/v1/users/u/<uname>` → 200, sees bio, avatar img, year, both published titles + counts; does
  NOT see draft title, become-author form, Edit/Delete; owner hits `/u/:me` → 302 to `/profile`;
  `/u/nonexistent` → 404. Cleanup DB + uploads.
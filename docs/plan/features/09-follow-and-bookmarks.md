# Feature 09 — Follow authors + Bookmarks (S4 + C1)

Source: features-plan.md S4 (follow authors), C1 (bookmarks/saved posts).

## Objective
Readers can follow authors and get their new posts surfaced (home feed section), and save posts to a
private bookmarks list. No social visibility for bookmarks; following is lightweight (array on User).

## Acceptance criteria
- S4-AC1: Logged-in user toggles follow on a public profile (no self-follow; 404 on unknown user).
- S4-AC2: Home shows a "From authors you follow" section with the latest published posts of followed
  authors (section hidden when none).
- S4-AC3: Public profile shows follower count; the owner sees the button as disabled/absent.
- C1-AC1: Logged-in user toggles bookmark on a post (published only; 404 on draft).
- C1-AC2: Private list page `/api/v1/users/bookmarks` lists saved posts; anon is redirected to login.

## Design
- `User.following: [ObjectId ref User] default []`; `User.bookmarks: [ObjectId ref Post] default []`
  (client uses `$addToSet`/`$pull`, matches the likes pattern).
- Follow/bookmark are plain form POST → redirect back (Referer, else home/post). Matches app UX.
- Home feed: `getFollowFeed(userId)` → published posts where `author $in following`, limit 3.
- Detail page bookmark toggle next to the like button (filled/outline book icon).

## Implementation steps
1. `models/user.model.js` — `following`, `bookmarks` arrays.
2. `services/user.service.js` — `toggleFollow`, `getFollowFeed`, `toggleBookmark`, `getBookmarks`;
   `getPublicProfile` gains `followerCount` + `isFollowing`.
3. `controllers/user.controller.js` — `toggleFollow`, `toggleBookmark`, `showBookmarks`.
4. `controllers/post.controller.js` — `showPost` computes `bookmarked`.
5. `routes/user.routes.js` — `POST /follow/:id`, `POST /bookmark/:postId`, `GET /bookmarks` (verifyJWT).
6. Views: profile follow button + follower count; detail bookmark button; navbar "Saved" (desktop +
   mobile); new `views/users/bookmarks.ejs`; home feed section in `views/home.ejs`.
7. `services/page.service.js` / home controller — pass follow feed when logged in.

## Verification
- `node --check` on touched files.
- Smoke: 3 users; A follows B (toggle on public profile), self-follow rejected; B publishes; A's
  home shows B's post in follow section; A unfollows → section gone; B profile shows follower 1;
  A bookmarks B's post + toggle off/on; `/bookmarks` shows it; anon `/bookmarks` → 302 login;
  draft cannot be bookmarked (404). Cleanup DB + uploads.
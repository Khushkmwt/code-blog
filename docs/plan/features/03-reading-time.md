# Feature 03 — Reading time estimate (C2)

Source: features-plan.md §3.1 (C2), BA suggestion.

## Objective
Show a "X min read" estimate on every post surface (detail page, post cards, profile post list)
computed from a single shared utility — no duplicate inline math anywhere.

## Acceptance criteria
- Reading time shown on the detail page, post cards (home + blog listing), and the profile post list.
- Value is consistent everywhere (same util, same formula: words / 200, min 1).

## Implementation steps
1. `readingMinutes` util already exists (feature 01). No new file needed.
2. `app.js` — import `readingMinutes` from `utils/reading-time.js` and attach it to
   `res.locals.readingMinutes` in the existing locals-init middleware, so every EJS view can call
   `<%= readingMinutes(post.detail) %>` without needing a controller to pass it.
3. `views/shared/partials/postcard.ejs` — add reading time next to the date:
   `<time ...><%= post.createdAt?.toDateString() %></time> · <%= readingMinutes(post.detail) %> min read`.
4. `views/users/profile.ejs` — replace the inline `Math.max(1, Math.ceil(...))` with
   `readingMinutes(post.detail)`.
5. Detail page already uses controller-passed `readMinutes`; no change needed there.

## Verification
- `node --check` on app.js.
- Live smoke: create a post, check detail + card + profile all show consistent "X min read".
- Grep views for leftover inline `Math.max(1, Math.ceil((` reading-time math — should be zero.

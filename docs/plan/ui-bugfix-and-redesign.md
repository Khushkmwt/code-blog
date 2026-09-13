# Plan — Bug fixes, Flash/Search features & Full UI Redesign

Status: proposed (awaiting review)
Date: 2026-09-14
Applies to: entire code-blog app (Node.js, Express 5, EJS 6, Mongoose 9, Tailwind v4 CDN)

---

## 1. Goals

1. Fix remaining backend bugs that surface as 500s, bad UX, or missing feedback.
2. Add three UX features: auto-login after signup, success/error flash messages, and post search.
3. Modernize the entire UI with a new, distinctive design system (no purple/blue/white "AI slop", no fixed placeholder layout).
4. Fix verified UI defects: 12 broken images, giant unused assets, stale footer layout, dead JS.

The single source of truth for approved decisions is this document. Expected reader: project author (reviews and approves), future maintainers.

---

## 2. Design system

### Palette (warm editorial — NOT purple/blue/white)

| Token | Light value | Dark value | Purpose |
|---|---|---|---|
| `--color-paper` | `#F7F4EF` (warm off-white) | `#1C1917` (charcoal) | page background |
| `--color-surface` | `#FFFFFF` | `#292524` | cards / panels |
| `--color-ink` | `#292524` | `#EDE9DF` | primary text |
| `--color-muted` | `#78716C` | `#A8A29E` | secondary text |
| `--color-brand` | `#C2410C` (burnt orange) | `#FB923C` | primary accent (CTA, links) |
| `--color-brand-soft` | `#FDE5D0` | `#431407` | accent backgrounds |
| `--color-teal` | `#0F766E` | `#2DD4BF` | secondary accent (badges, success) |
| `--color-line` | `#E7E5E4` | `#44403C` | borders / dividers |

Fonts: Google Fonts **Inter** (body) + **Plus Jakarta Sans** (display/headings).

Stack: Tailwind **v4 browser CDN** (`@tailwindcss/browser@4`), with `@theme` tokens + `@custom-variant dark (&:where(.dark, .dark *))` defined once in the boilerplate so `dark:` variants work class-based (toggle persists to localStorage, falls back to system preference).

### Layout shell (fixes "footer in mid when content is less")

```
<body class="flex min-h-screen flex-col bg-paper text-ink ...">
  <%- include('partials/navbar') %>
  <main class="flex-1">
    <%- include('partials/flash') %>
    <%- body %>
  </main>
  <%- include('partials/footer') %>
</body>
```

Footer is a normal block flow element; `main` grows with `flex-1` so the footer is always pinned to the bottom and never floats mid-page on short pages (login/signup/error).

---

## 3. Bug fixes (backend)

| # | File | Issue | Fix |
|---|---|---|---|
| B1 | `controllers/user.controller.js` | `registerUser` accepts empty/whitespace fields; Mongoose required-errors → raw 500 | Validate `name/email/username/password`, password ≥ 6; throw `ApiError(400)` |
| B2 | `controllers/user.controller.js` | `changeCurrentPassword` empty `newPassword` → `bcrypt.hash` rejects → 500 | Require non-empty new password (≥ 6) → 400 |
| B3 | `controllers/post.controller.js` | duplicate unique `title` → Mongo `11000` → 500 | Catch duplicate error → `ApiError(409, "Title already exists")`; trim inputs in create/update |
| B4 | `app.js` | error handler treats Mongoose `ValidationError`/`11000` as 500 | Map `ValidationError`→400, `code===11000`→409, else `err.statusCode`/500 |
| B5 | `middleware/multer.middleware.js` | no file-size limit or type filter | `limits: { fileSize: 5MB }` + image-only `fileFilter` for avatar (also used by any future uploads) |
| B6 | `app.js` | `express.json()/urlencoded` unbounded | `{ limit: '10kb' }` |
| B7 | `controllers/user.controller.js` | auth cookies no `sameSite` | add `sameSite: 'lax'` to access/refresh cookie options (3 places) |

Note: earlier spinner-class bugs (JWT seeding, ownership checks, secure/local mode, mongoose 9 pre-save, config/dual-mode) are already fixed and committed.

---

## 4. New feature — Auto-login after signup

- `registerUser` (after `user.save()`): call `generateAccessAndRefereshTokens`, set `accessToken`/`refreshToken` cookies with same options as `loginUser`, redirect `/home` with success flash.
- New users land logged-in (navbar shows Profile/Logout immediately).

---

## 5. New feature — Flash messages

- **New** `middleware/flash.middleware.js`: reads a one-shot `flash` httpOnly cookie → `res.locals.flash = { type, message }`, clears cookie.
- **New** `views/partials/flash.ejs`: toast/alerts (`success`/`error`/`info`), auto-dismiss ~4s, included once in boilerplate inside `main`.
- Controllers set flash before redirects:
  - login success, register success, change-password success, create/update/delete post, create/edit/delete comment, logout.
- Error pages still render via the error handler; optional banner shows `err.message`.

---

## 6. New feature — Search posts

- `routes/blog.route.js` GET `/api/v1/blog`:
  - `?search=` → case-insensitive regex on `title` or `desc` (special chars escaped).
  - Pagination + search: `?page=N&search=...`, `page = max(1, ...)`.
- `views/blog.ejs`: search input (GET form, prefilled), results count, empty state ("No posts match your search") when zero, styled pagination pills that preserve `search`.

---

## 7. UI redesign — page by page

All pages become dark-mode ready and use the palette in §2. Shared partials: `navbar`, `footer`, `flash`, and a reusable post-card partial.

### `views/layouts/boilerplate.ejs`
- Meta description + OG tags; canonical title per page via locals (e.g. `title || 'Code-Blog'`).
- Tailwind v4 browser CDN + inline `<style type="text/tailwindcss">` defining `@theme` tokens + dark custom-variant.
- Fonts preconnect + Inter/Plus Jakarta Sans; favicon `favicon.svg`; deferred `public/index.js`; `public/style.css` (small custom CSS: scrollbar, toast animation, prose, focus ring).

### `views/layouts/navbar.ejs` (rebuilt)
- Sticky top, `backdrop-blur`, paper/smoke bg, dynamic account menu (avatar + name for logged-in; Log In / Sign Up for guests), dark-mode toggle, working mobile slide-down menu (JS moved to `public/index.js`).

### `views/layouts/footer.ejs` (rebuilt + sticky)
- Brand + short tagline, link columns (Home, Blog, About, Contact), newsletter input (UI-only), social row, copyright. Bottom-pinned via `flex-1` main (see §2).

### `views/home.ejs`
- Modern hero: headline + subcopy + CTA ("Read the Blog" / "Start Writing"), no frozen pale pink/blue gradient — use brand-soft mesh on paper.
- Stats row (posts/users) driven by real counts passed from the route.
- **Latest posts**: `/` and `/home` fetch newest 3 posts (`title`, `desc`, `author`, `createdAt`) → rendered as cards (reuse blog card partial).
- Photo gallery using light assets (`gallery1/4/5`), testimonials as cards, final CTA band.

### `views/blog.ejs`
- Search bar (§6), results count, card grid (hover lift, author + date, teaser), pagination pills, empty state.

### `views/show.ejs`
- Featured post layout: title, author chip (avatar/initial + name + date), prose block for `desc`/`detail` (keep `<pre>` styling clean), owner-only Update/Delete buttons.
- Comments: cleaner list (avatar/initial, owner badge, date, content, edit/delete for owner), styled comment form for logged-in users, login prompt otherwise.

### `views/profile.ejs`
- Card: decorative cover strip (brand-soft), avatar, name/email/role, joined date, stat chips (posts count, comments?).
- Posts list: modern list/cards with title + date, links to show page.
- Actions: Change Password (points to existing `/api/v1/users/change-password`).

### `views/login.ejs` / `views/signup.ejs`
- Split-card layout (form + brand panel), show/hide password toggle, inline validation, disable submit while pending (vanilla JS).

### `views/changepass.ejs`
- Centered card, old/new password with toggle, match + min-length hints.

### `views/about.ejs`
- Keep narrative sections, use real images only: `about2.jpg`, `team.avif`.
- Replace broken `/images/team-member1-3.jpg` and empty photo slots with gradient initial-avatars (no fake photos).

### `views/contact.ejs`
- Replace 8× broken `/path/to/*.jpg` placeholders + placeholder text with real info; add a working-form UI (name/email/message; front-end only, `mailto:` submit or non-persistent; note clearly "coming soon" if backend out of scope).

### `views/error.ejs`
- Friendly 404/error page: big status, message, "Back to Home", links.

### `public/index.js`
- Remove dead `.logo-svg` animation. Consolidate: dark-mode toggle/persist, mobile menu, toast auto-dismiss, password toggles, form submit feedback, (contact) form handler.

### `public/style.css`
- Expand: base body defaults, focus-visible ring, toast transition, prose/`pre` styling, avatar fallback.

---

## 8. Images handling ("use needed images only")

- Keep only assets used by pages: `favicon.svg`, `logo.jpg`, `gallery1.jpg`, `gallery4.jpg`, `gallery5.jpg`, `about2.jpg`, `team.avif`.
- Stop referencing: `about.jpg` (7 MB), `teamjpg.jpg` (3.4 MB), `gallery2.jpg` (2.5 MB), `gallery3.jpg`.
- Delete confirmed-unused files from `public/assets/` during build (listed in task; confirm before deleting).
- All `/images/*` and `/path/to/*` references removed.

---

## 9. Files touched

New:
- `docs/plan/` (this file)
- `middleware/flash.middleware.js`
- `views/partials/flash.ejs`
- `views/partials/navbar.ejs`, `views/partials/footer.ejs` (moved from `views/layouts/` — keep include paths working) *(see note)*

Changed:
- `app.js` (error mapping, body limit, flash middleware mount, home latest-posts, title locals)
- `controllers/user.controller.js` (B1, B2, B7, auto-login)
- `controllers/post.controller.js` (B3)
- `controllers/comment.controller.js` (flash messages only)
- `middleware/multer.middleware.js` (B5)
- `routes/blog.route.js` (search + counts)
- `routes/user.route.js`, `routes/post.route.js` (flash, title locals)
- `views/*` all 11 templates + `layouts/*` + `public/style.css` + `public/index.js`

> Note: navbar/footer already live in `views/layouts/` and are included by `boilerplate.ejs`. Decide during build whether to keep them in `views/layouts/` (fewer moves) or move to `views/partials/`. Default: **keep in `views/layouts/`** to avoid include-path churn; only message content is rebuilt.

---

## 10. Verification

1. **Template render test**: render all 11 views with simulated `res.locals` (isLoggedIn, post/comment/user fixtures) — assert no EJS errors and zero broken image `src`.
2. **Live smoke test (local mode)**: start server; exercise signup (with image → auto-login), logout, login, search (via `?search=`), create/edit/delete post + comment, change password, flash toasts render.
3. **Prod-mode sanity**: boot with `MODE=prod` + local DB; confirm config/storage wiring unchanged.
4. **Dark mode + responsive**: toggle persists on reload; mobile menu toggles; footer pinned on short pages (login/error).
5. Clean up test records/uploaded files afterwards.

---

## 11. Out of scope (for now)

- Real email/contact backend (contact form is UI + `mailto:`).
- Real-time features, likes/notifications, image lightbox.
- Building Tailwind locally (CDN stays; no build step).
- Adding comments feature to profile stats, scheduled posts, roles beyond user/admin.

## Review 


---

## Addendum — UI review changes (2026-09-14)

**§2 Design system — add a usage rule for `--color-teal`:**

> `--color-teal` is a punctuation color only — badges, "new" tags, success states, inline confirmations. It must never be used as a background wash, button fill, or hero element alongside `--color-brand`. If a component needs two accents at once, default to `--color-brand` + neutral, not brand + teal.

**§2 Design system — add contrast pairing for `--color-brand-soft`:**

| Token | Light value | Dark value | Text color to pair with it |
|---|---|---|---|
| `--color-brand-soft` | `#FDE5D0` | `#431407` | Light: `--color-ink` (`#292524`) · Dark: `--color-paper` (`#F7F4EF`) — never place `--color-muted` text on this background, contrast fails |

**§2 Design system — replace font pairing:**

> ~~Fonts: Google Fonts Inter (body) + Plus Jakarta Sans (display/headings).~~
> Fonts: Google Fonts **Inter** (body, UI) + **[a slab or serif display face, e.g. "Fraunces" or "Zilla Slab"]** (display/headlines). Rationale: two humanist sans faces read as one undifferentiated voice; a serif/slab display reinforces the editorial identity and separates headline from body at a glance.

**§2 Design system — new subsection, "Component tokens" (insert after palette table, before Layout shell):**

> - **Radius scale:** `--radius-sm: 6px` (inputs, pills) / `--radius-md: 10px` (cards) / `--radius-lg: 16px` (modals, feature panels). No ad-hoc radius values in templates.
> - **Cards:** hairline border (`--color-line`) + flat surface, no drop shadow by default. Shadow only on hover-lift for interactive cards (blog grid). This is a deliberate editorial choice — avoid the default "SaaS card" soft-shadow-on-everything look.
> - **Buttons:** three variants only — filled (`--color-brand` bg), outline (`--color-brand` border/text), ghost (text only, `--color-ink`). No teal buttons (see teal rule above).
> - **Type scale:** define once in boilerplate — h1/h2/h3/body/caption — and reuse across all 11 views rather than each page picking its own sizes.

**§7 Home hero — replace mesh gradient direction:**

> ~~use brand-soft mesh on paper~~
> Ground the hero in the actual subject matter — a stylized code/terminal snippet or a monospace line animating in — rather than an abstract gradient wash. Mesh gradients over warm-cream palettes are one of the most common generic-AI-design tells; a code-grounded hero is both more distinctive and more immediately legible as a dev blog.

**§6 Search — add debounce decision:**

> Search input submits on Enter or after a 400ms debounce on keystroke (client-side JS), not on every keystroke. Prevents request thrash on the `/api/v1/blog?search=` endpoint.

**§7 — add empty states:**

> `views/blog.ejs` and `views/profile.ejs` each need a zero-posts empty state (not just zero-search-results), consistent with the empty-state pattern already planned for search.

**§7 Flash partial — add accessibility requirement:**

> `views/partials/flash.ejs` toast container carries `aria-live="polite"`; auto-dismiss timer and entrance/exit animation both respect `prefers-reduced-motion: reduce` (skip animation, keep timing).

---

## Review sign-off

**Reviewed:** backend bug fixes (§3), auto-login (§4), flash middleware (§5), search (§6), image cleanup (§8), verification plan (§10).
**Status:** ✅ Approved as written — no changes requested.

**Reviewed:** design system and page-by-page UI redesign (§2, §7).
**Status:** ✅ Approved **with the changes above incorporated** before build starts. None of these are structural — they're refinements to the same direction (warm editorial, no AI-slop palette), not a redirect.

**Not blocking, can be decided during build:** navbar/footer folder location (§9 note), exact serif/slab typeface pick, exact radius values if the ones above don't feel right in practice.

**Open question for you to resolve before implementation:** pick the display typeface from the options above (or propose your own) — that's the one item in this addendum that needs a decision rather than just a spec.
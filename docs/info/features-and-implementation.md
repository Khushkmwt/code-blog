# Code-Blog — Features & Implementation

> **Code-Blog** is a full-stack, server-side-rendered blogging platform built for developers — a place to publish tutorials, debugging stories, and code snippets. Live at <https://code-blog-4xod.onrender.com/home>.

## Overview

| Aspect | Detail |
|---|---|
| **Type** | Full-stack SSR web app |
| **Backend** | Node.js, Express ^5.2.1 |
| **Database** | MongoDB via Mongoose ^9.10.0 |
| **Auth** | JWT (access + refresh tokens in httpOnly cookies) |
| **Frontend** | EJS templates + Tailwind CSS v4 (CDN), vanilla JS |
| **Modules** | ES Modules (`"type": "module"`) |
| **License** | ISC |
| **Author** | Khush Kumawat |

## Architecture

Strict layer separation:

```
Request → Route → Controller → Service → Model → DB
```

```
code-blog/
├── app.js                  # Express app assembly, mounts apiV1Router via routes/index.routes.js
├── index.js                # Entry point — dotenv, connectDB, listen
├── config/                 # Env config (index.js), DB connection, constants
├── controllers/            # Request/response handling
├── services/               # Business logic
├── models/                 # Mongoose schemas
├── middlewares/            # auth, flash, error, multer, not-found, validate
├── routes/                 # Express routers, mounted under /api/v1
├── schemas/                # Joi validation schemas
├── utils/                  # ApiError, ApiResponse, asyncHandler, upload, markdown, reading-time
├── views/                  # 24 EJS templates
├── public/                 # style.css + vanilla-JS files + static assets
└── docs/plan/              # Planning docs & feature specs
```

Routes are registered centrally in `routes/index.routes.js` via `app.js`:

| Prefix | Router | Handles |
|---|---|---|
| `/users` | auth.routes | register, login, logout, refresh-token, change-password |
| `/users` | user.routes | profile, public profile, bio, become-author, follow, bookmarks, notifications |
| `/blog` | blog.routes | GET `/` (list), GET `/show/:id` |
| `/post` | post.routes | create, draft, update, delete, like |
| `/post/comment` | comment.routes | create, edit, delete |

## Features Implemented

### 1. Authentication & Accounts
- Registration with avatar upload (image-only filter, 5MB limit), auto-login after signup, duplicate email/username rejection.
- Login by **email or username**; JWT **access token (1d)** + **refresh token (10d)** stored in `httpOnly`, `sameSite=lax` cookies (secure in prod).
- Logout (unsets refreshToken, clears cookies); refresh-token rotation endpoint.
- Change password (requires current password, new ≠ old, min 6 chars).
- Roles: `reader` by default, self-promotion to `author` via "Become an author" (idempotent); `admin` reserved but no admin UI (deferred).
- Unread-notification count loaded per request into `res.locals`.

### 2. Content & Authoring
- Post CRUD, gated by `requireRole(ROLES.AUTHOR)` + ownership checks in services.
- **Markdown editor** with live client-side preview (Write/Preview tabs), debounced rendering.
- Server-side markdown pipeline: `markdown-it` (`html:false, breaks:true, linkify:true`) → `sanitize-html` with a strict allowlist (tags, attrs, `http/https/mailto` schemes, `rel="nofollow noopener noreferrer"`, `target="_blank"` on external links).
- **Syntax highlighting** via highlight.js CDN (`github-dark-dimmed` theme) on detail pages and editor preview.
- **Drafts + background autosave**: `status: draft|published`; create page autosaves via JSON endpoint `POST /api/v1/post/draft` every 30s / 15s after typing; drafts visible only to owner; publishing reuses the same document.
- **Tags** (up to 10, normalized lowercase `[a-z0-9-]`, max 30 chars) with tag-filtered listings.
- Title uniqueness enforced (duplicate → 409 with friendly message).
- Prefilled sample markdown in the create-post editor.

### 3. Discovery
- **Search**: case-insensitive regex on `title`/`desc` with user-input regex escaping; debounced (400ms) live search + Enter key; search preserved across pagination.
- **Pagination**: 6 posts/page with prev/next preserving search + tag params.
- **Related posts** by shared-tag overlap, max 3.
- **View counts** on published posts (incremented on each detail view).
- **Reading time** estimate (`words / 200`, min 1 min) on cards, detail pages, and profiles.

### 4. Engagement & Social
- **Comments** with one-level nested replies (`parent` field; deeper nesting → 400).
- Comment edit/delete with ownership checks.
- **Likes/reactions** toggle on published posts + like count + notification on like.
- **Follow authors** (can't follow self); **follow feed** on home (latest 3 posts from followed authors).
- **Bookmarks / saved posts** (private), toggle on post detail.
- **In-app notifications**: comment on your post, reply to your comment, like on your post; unread badge in navbar, mark-all-read on the notifications page; likes deduplicated per actor+post.
- **Public author profiles** at `/api/v1/users/u/:username` (bio, avatar, follower count, published posts only).

### 5. UI / UX
- Dark mode toggle persisted in localStorage, falls back to system preference.
- Flash messages as one-shot toast cookies (`success`/`info`/`error`), auto-dismiss ~4s, `aria-live`, respects `prefers-reduced-motion`.
- Responsive layout with sticky navbar, mobile slide-down menu, account dropdown.
- Terminal/CLI-themed aesthetic (`$ ls posts`, code-chip badges, hero typing animation).
- Custom design tokens in boilerplate (`--c-paper`, `--c-ink`, `--c-brand`, term colors); **no hardcoded hex colors anywhere**.
- Static pages: Home (hero, stats, follow feed, latest posts, gallery, testimonials, CTA), About, Contact (`mailto:` form).

### 6. Error Handling
- Centralized `ApiError` + error middleware maps: `MulterError`→400, Mongoose `ValidationError`→400, Mongo `11000` duplicate→409, JWT errors→401, `CastError`→404.
- Friendly error page for all errors; `404` notFound middleware.
- `asyncHandler` wraps all async controllers.

## Data Models

| Model | Key fields |
|---|---|
| **User** | name, email (unique), username (unique), password (bcrypt-hashed via pre-save), role (`reader`/`author`/`admin`), refreshToken, coverImg, bio (max 160), following[], bookmarks[]; methods: `isPasswordCorrect`, `generateAccessToken`, `generateRefreshToken` |
| **Post** | title (unique), desc (required unless draft), detail (required unless draft), author (ref User), tags[], status (`draft`/`published`), likes[] (ref User), views (counter) |
| **Comment** | content, owner (ref User), post (ref Post), parent (ref Comment, self-ref for replies) |
| **Notification** | user (indexed), type (`comment`/`reply`/`like`), actor (ref User), post, comment, `read`; compound index `{user, read}` |
| **Image** / **Video** | Present but unused / unwired (vestigial) |

## Config & Tooling

- **Dual-mode environment** (`config/index.js`): `MODE=local` → local MongoDB, files to `public/uploads`, hardcoded dev JWT fallbacks, Cloudinary disabled; `MODE=prod` → all creds from env vars, files uploaded to **Cloudinary**.
- Cookie options centralized in `config/constants.js`.
- Upload strategy (`utils/upload.js`): prod → Cloudinary (temp file deleted), local → move to `public/uploads`.
- Body parser limits: `express.json/urlencoded` capped at 50kb.
- npm scripts: `dev` (nodemon), `start` (node), `start:prod` (`MODE=prod node index.js`).
- No test suite yet (`test` script is a placeholder).
- Deployed on Render; CORS origin hardcoded in `.env.example`.

## Known Gaps / Notes

- `Image` and `Video` models exist but are unused.
- Contact form is front-end only (`mailto:`).
- Admin role reserved, not implemented.
- No CSRF protection (relies on `sameSite=lax`), no rate limiting.
- Most actions are classic POST-form redirects; only draft autosave uses `fetch`.
- Design/feature decisions documented in `docs/plan/` (restructure, dev-rules, features-plan, feature specs).

## Local Build / Pre-Deploy Check

Because Code-Blog is server-rendered (no bundler), a healthy deploy is not confirmed by `npm install` alone — a broken import, a JS syntax error, or a malformed EJS template only surfaces when the app boots or a view renders *on Render*. To catch these locally *before* pushing, there is a static build check:

### `npm run build`

Runs [`scripts/build-check.mjs`](../../scripts/build-check.mjs), which:

1. **Validates the backend import graph** — imports `app.js`, which pulls in the entire module graph (routes → controllers → services → models → middlewares → utils). Any syntax error, missing import, bad named export, or throw in top-level code is caught immediately. It only *imports* the app; it does **not** connect to MongoDB or bind a port, so it runs fast and is safe in any CI/Render build context.
2. **Compiles every EJS template** in `views/**` with `ejs.compile`, catching template syntax errors (the most common cause of a runtime 500 post-deploy).

Exits `0` on success, `1` on failure with a summary. Run it manually with `npm run build`.

### Automatic pre-push gate

A [`pre-push` hook](../../.githooks/pre-push) (active via `git config core.hooksPath .githooks`) runs `npm run build` before **every** push. If the check fails, the push is aborted, so a known-broken state can never reach the branch Render auto-deploys from. To bypass deliberately: `git push --no-verify`.

To (re)install the hook after cloning on a fresh machine, run once:

```sh
git config core.hooksPath .githooks
```

Related npm scripts: `test` aliases `build`; `prepush` runs `build` manually. The project has no test suite (no `mongod`/DB dependency required for builds — all checks are static).
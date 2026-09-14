# Development best practices — code-blog project

Status: reference doc, applies to all future work on this codebase (Node.js, Express, EJS, Mongoose, Tailwind).

These are working rules, not suggestions. If a change violates one of these, fix the change, not the rule.

---

## 1. No hardcoded colors

Every color used in markup, CSS, or JS must come from a defined token — never a raw hex/rgb value typed inline.

- Define all colors once in the Tailwind `@theme` block (or a `colors.js`/`tokens.css` file if the system grows past CSS variables).
- Reference tokens everywhere: `bg-paper`, `text-ink`, `border-line`, not `bg-[#F7F4EF]`.
- If a one-off color is genuinely needed (rare), it still gets a named token — even if it's only used once today. The point isn't reuse count, it's that a rebrand or dark-mode fix touches one file, not every template.
- Same rule for spacing scales, shadows, and radii if the project starts hardcoding those too (`--radius-sm`, `--shadow-card`, etc.) — anything that could plausibly need a global update later belongs in a token, not inline.
- Colors are a special case where global almost always makes sense (the whole point is that the whole app agrees on one palette), but the same scoping question from §2 still applies to *component-level* design values — e.g. a one-off spacing tweak used by exactly one component doesn't need to be promoted to the global theme file, it can be a local class/value inside that component until a second component needs the same thing.

**Bad:** `<div class="border border-[#E7E5E4] rounded-[10px]">`
**Good:** `<div class="border border-line rounded-md">`

---

## 2. Centralize constants — but scope them by who actually uses them

Any value that represents a rule, limit, or fixed fact about the system should be named and defined once, not typed inline wherever it's used. But "once" doesn't automatically mean "in one global file." Scope the constant to where it's actually reused — module-local if only that module (now or foreseeably) needs it, global/shared if multiple modules genuinely depend on the same value.

**Goes global** — used across modules, or a value the whole app needs to agree on:
- **File types / extensions:** `ALLOWED_IMAGE_TYPES` — used by the multer filter, the frontend `accept` attribute, and potentially any future upload type. Cross-cutting, belongs in a shared `constants.js`.
- **Cookie/token settings:** `ACCESS_TOKEN_EXPIRY`, `REFRESH_TOKEN_EXPIRY`, `COOKIE_OPTIONS` — used by login, register (auto-login), and refresh — multiple controllers need the same values to stay in sync. Shared config.
- **Validation rules shared across layers:** `MIN_PASSWORD_LENGTH` — referenced by both backend validation and frontend hint text, so it can't drift between the two.

**Stays local to its module** — a limit or value only one feature cares about, even if it looks similar to something elsewhere:
- **Avatar upload size limit:** if only the avatar upload uses it, define `MAX_AVATAR_SIZE_MB` inside `multer.middleware.js` (or a local constants block at the top of that module), not in the shared/global constants file. A future "post attachment" upload with a *different* size limit shouldn't have to reason about or override a global value that was only ever about avatars.
- **Pagination default for one specific listing:** `POSTS_PER_PAGE` for the blog listing can live next to the blog route/controller if nothing else paginates yet. Promote it to shared config only when a second module (e.g. comments pagination) needs the same number — don't pre-emptively share it "just in case."
- Anything single-purpose and unlikely to be reused: keep it next to the code that uses it. A local constant is easier to find, easier to change safely, and doesn't force unrelated modules to scroll past config that isn't theirs.

**Deciding which bucket a constant goes in:**
1. Is this value referenced by more than one module today? → Global.
2. Is it very likely a near-future feature will need the *same* value (not just a similarly-named one)? → Global.
3. Otherwise → Local to the module, even if a conceptually similar constant exists elsewhere in the global file. Similar-looking limits for different features are not the same constant — don't merge them just to avoid a duplicate name.

Two `MAX_*_SIZE_MB` constants living in two different modules, each governing a different upload type, is not a DRY violation — it's two separate facts about two separate features. Forcing them into one shared constant is what actually creates coupling: a change meant for one upload type now risks silently affecting the other.

Rule of thumb: centralize the *definition* so there's exactly one source of truth per fact — but let the fact's actual scope of use decide whether that one source lives in a shared file or inside the module it belongs to. A global constants file that accumulates every limit "just in case" becomes its own maintenance hazard — nobody can tell from the file alone which constants are load-bearing across the app and which were only ever used in one place.

---

## 3. Follow DRY (don't repeat yourself)

- If the same markup block appears on 2+ pages (post card, avatar fallback, form input with label+error), extract it into a partial/component. This project already plans a shared post-card partial — apply the same instinct to buttons, form fields, and the avatar-initial fallback.
- If the same logic appears in 2+ controllers (flash-then-redirect, cookie options, error shaping), extract a helper function. Don't copy-paste a try/catch pattern across controllers — wrap it once (e.g. an `asyncHandler` or shared error mapper).
- Duplication is fine the *first* time something looks similar — don't abstract prematurely on a single occurrence. Extract on the second or third repetition, once the pattern is confirmed, not on a guess.
- Config that's environment-dependent (dev/prod mode, DB URIs) lives in one config module, not re-read from `process.env` inline across multiple files.

---

## 4. Design for minimal, non-breaking changes

- **Isolate the blast radius.** A change to one page's styling shouldn't require touching unrelated pages. A change to one controller's validation shouldn't require updating three other controllers. If it does, that's usually a sign something should have been a shared constant/helper (see §2, §3) rather than copy-pasted logic.
- **Additive over destructive.** Prefer adding a new optional field/param with a safe default over changing the shape or meaning of an existing one. If a breaking change is unavoidable, update every call site in the same commit and search the codebase for the old usage before merging.
- **Keep functions small and single-purpose.** A function that does one thing can be changed, tested, or replaced without touching the six other things it was doing. If a controller both validates input, hits the DB, and formats a response, a change to validation risks breaking response formatting by accident.
- **Don't couple UI to backend internals.** Views should render off clearly-shaped data passed from the route (e.g. `{ posts, page, totalPages, search }`), not reach into raw Mongoose documents or make assumptions about internal field names. This way a schema change is a mapping-layer fix, not an 11-template hunt.

---

## Additional practices worth adopting

### 5. Consistent error handling
All errors should flow through one shape (e.g. the existing `ApiError` pattern) and one central handler that maps known error types (`ValidationError`, Mongo `11000`, JWT errors) to status codes. Controllers throw; they don't format HTTP responses themselves. This is what makes the flash-message and error-page work in the plan actually maintainable — one place decides what the user sees.

### 6. Validate at the boundary, trust internally
Validate and sanitize input (body, params, query) at the route/controller boundary — once — rather than re-checking the same field deeper in the call stack. Once data has passed validation, downstream code should be able to trust its shape.

### 7. Environment-driven config, no hardcoded environment checks
Avoid scattering `if (MODE === 'prod')` throughout the codebase. Centralize environment-dependent behavior (DB connection, cookie `secure` flag, storage backend) in the config module, and have the rest of the app depend on the resolved config values, not on `MODE` directly.

### 8. Name things by what they are, not how they're built
A variable or route called `getUserData` is less useful than `getUserProfile`. Match names to the domain concept (post, comment, session) rather than implementation detail. This matters most in shared partials and helper functions, where the name is the only documentation most future readers will see.

### 9. Comment the "why," not the "what"
Code should be readable enough that comments aren't needed to explain *what* a line does. Reserve comments for *why* a non-obvious decision was made (e.g. "escaping regex chars here because `search` is user input passed straight into a Mongo `$regex`").

### 10. Keep a single source of truth for cross-cutting UI values — but don't over-globalize
Things like the type scale, spacing rhythm, and button variants (already called out in the design-system addendum) are genuinely cross-cutting — every page uses them — so they belong once in the boilerplate/theme, never redefined per-page. But a style that's only relevant to one specific component (say, a unique layout tweak on the profile cover strip) doesn't need to become a global token just to follow this rule. Same test as §2: if a second place would reuse it, promote it to the shared theme; if not, keep it scoped to the component/page that owns it.

### 11. Write tests around behavior, not implementation
When adding tests (even lightweight smoke tests, per the plan's §10 verification section), assert on outcomes ("search with no matches shows the empty state") rather than internal implementation details ("calls `Post.find` with these exact arguments"). This lets internals change without breaking tests unnecessarily.

### 12. Keep dependencies and assets lean
Same spirit as the "use needed images only" cleanup in the plan — apply it to npm packages too. Before adding a new dependency, check if an existing one already covers the need. Remove unused packages during cleanup passes, not just unused images.

### 13. Register routes through the index router, never in app.js
All feature routers are bundled by `routes/index.routes.js` into a single `apiV1Router`, and `app.js` mounts it once: `app.use('/api/v1', apiV1Router)`. `app.js` must not change when routes are added or modified.

- New domain routers (e.g. a future `reports.routes.js`) get one import + one entry in the `mountings` array in `routes/index.routes.js` — never a new `app.use(...)` line.
- Several routers may share a mount prefix (e.g. `authRouter` and `userRouter` both on `/users`, `postRouter` on `/post` and `commentRouter` on `/post/comment`). Express falls through to later routers when a route doesn't match, so the combined mount preserves the same behavior as separate mounts — but keep the entries in the same top-to-bottom priority order as before.
- When you restructure or extend the API version/paths, you edit one file (the index router), and `app.js` stays untouched.
- Verification: after changing the index router, run the relevant smoke script (server boot + a couple of route hits) to confirm mounting order is still correct.
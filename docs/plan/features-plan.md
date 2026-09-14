# Feature planning v2 — content, engagement, profiles & admin

Role: Business Analyst
Status: draft for review
Date: 2026-09-14
Scope: next feature set beyond the current release (bug fixes + flash/search + UI redesign)
Areas selected: Content & authoring, Engagement, Account & profiles, Admin & control
Plus: additional recommendations flagged below where noted **[BA suggestion]**

---

## 1. Why these four areas together

These aren't independent — they form one loop: **authoring** produces better content → **engagement** signals what readers value → **profiles** give authors an identity worth building → **admin/control** keeps the loop healthy as the site grows past a handful of trusted users. Planning them together avoids building engagement features (e.g. comments) without also planning the moderation tools that become necessary the moment engagement features ship.

---

## 2. Feature backlog (MoSCoW)

### Must have (highest value, foundational for the rest)
- M1. **Rich text / markdown editor** for post creation & editing (replace plain `<textarea>`)
- M2. **Code syntax highlighting** in rendered posts **[BA suggestion — this is close to non-negotiable for a dev blog; unhighlighted code blocks undercut the entire premise of the site]**
- M3. **Tags/categories** on posts (create, assign, filter by tag)
- M4. **Public author profile page** (bio, avatar, post list, joined date — already partly planned in current UI redesign, extending it here)
- M5. **Roles: admin / author / reader**, with admin able to manage users and moderate content
- M6. **Likes/reactions** on posts

### Should have
- S1. **Draft posts + autosave** (save without publishing, resume later)
- S2. **Nested comment replies** (reply-to-comment, one level deep)
- S3. **In-app notifications** (someone commented on your post / replied to your comment)
- S4. **Follow authors** (see followed authors' new posts, e.g. on a personalized feed or home section)
- S5. **Admin dashboard** (user count, post count, flagged content queue, basic moderation actions)
- S6. **Report/flag content** (comment or post) for admin review
- S7. **Related posts** (by shared tags) shown at the bottom of a post **[BA suggestion]**

### Could have
- C1. **Bookmarks/saved posts** (private list, no social visibility)
- C2. **Reading time estimate** on post cards/pages **[BA suggestion — cheap to compute from word count, high perceived value]**
- C3. **Table of contents** auto-generated from post headings, for long posts **[BA suggestion]**
- C4. **RSS feed** for the blog **[BA suggestion — dev-blog readers commonly expect this; low effort once posts have stable slugs]**
- C5. **Post view counts** (simple counter, not full analytics)
- C6. **Email notifications** (digest or per-event, opt-in) — depends on having email infra, which is currently out of scope per the original plan

### Won't have (this phase — explicitly deferring)
- Full analytics/dashboards beyond basic counts
- Real-time features (live comment updates, presence)
- Multi-level (2+) comment nesting
- Monetization/paywall features
- Third-party auth (OAuth) — separate initiative if wanted later

---

## 3. Feature area breakdowns

### 3.1 Content & authoring

| Feature | What it solves | Notes |
|---|---|---|
| Rich text/markdown editor (M1) | Current plain textarea makes formatting, code blocks, and links painful to write | Markdown-based (e.g. a markdown textarea + live preview) is lower-effort and more dev-audience-appropriate than a full WYSIWYG; recommend markdown over WYSIWYG for this audience |
| Code syntax highlighting (M2) | Code snippets currently render as unstyled `<pre>` text | Pairs directly with M1 — highlighting only matters once the editor supports fenced code blocks |
| Tags/categories (M3) | No way to browse by topic; search only covers title/description | Feeds directly into related-posts (S7) and future tag-filtered search |
| Draft posts + autosave (S1) | Authors currently must publish to save any progress | Needs a `status: draft/published` field on the post schema |
| Reading time (C2) | Readers can't gauge commitment before clicking in | Pure computed value, no schema change, cheap win |
| Table of contents (C3) | Long technical posts are hard to navigate | Only worth building once posts are long/structured enough (post-M1) |

### 3.2 Engagement

| Feature | What it solves | Notes |
|---|---|---|
| Likes/reactions (M6) | No lightweight way for a reader to signal approval without writing a comment | Simplest engagement signal to ship; also useful input for a future "popular posts" sort |
| Nested comment replies (S2) | Flat comment lists make threaded discussion hard to follow | Cap at one level of nesting to avoid UI complexity (per Won't-have) |
| In-app notifications (S3) | Authors/commenters have no way to know their post/comment got a response | Depends on M5 (roles) only loosely; mainly depends on comments/likes existing first |
| Related posts (S7) | Readers hit a dead end at the bottom of a post | Depends on M3 (tags) being in place |
| Post view counts (C5) | No signal of what's actually being read | Simple counter increment on page view; no need for full analytics yet |

### 3.3 Account & profiles

| Feature | What it solves | Notes |
|---|---|---|
| Public author profile (M4) | Authors have no shareable identity/portfolio page | Extends the profile page already planned in the UI redesign — this adds *public* visibility (currently profile is self-view only) |
| Follow authors (S4) | Readers who like an author's writing have no way to track new posts | Needs a lightweight "following" relation on the user schema; feed logic can start simple (just a filtered post list) |
| Bookmarks/saved posts (C1) | Readers can't save a post to read later | Private-only, no social/visibility component — simplest of the social features |

### 3.4 Admin & control

| Feature | What it solves | Notes |
|---|---|---|
| Roles: admin/author/reader (M5) | Currently no distinction beyond generic "user" — no way to moderate | Foundational — several other features (dashboard, reporting) depend on this existing first |
| Admin dashboard (S5) | No visibility into site health or flagged content | Start minimal: counts + a flagged-content queue, not a full analytics suite |
| Report/flag content (S6) | No way for users to flag inappropriate posts/comments | Needs M5 (roles) to exist so there's someone to review reports |

---

## 4. Dependency map (what must come before what)

```
M1 (editor) ──► M2 (syntax highlighting)
M1 (editor) ──► C3 (table of contents)
M3 (tags)   ──► S7 (related posts)
M5 (roles)  ──► S5 (admin dashboard)
M5 (roles)  ──► S6 (report/flag)
S6 (report) ──► S5 (dashboard's moderation queue)
M6 (likes) + S2 (comments) ──► S3 (notifications)
S4 (follow) is independent, can build any time after M4 (public profile)
```

Practical read: **M1 → M2 → M3** is one natural build order (content foundation), and **M5 → S6 → S5** is a second (control foundation) that can happen in parallel with the first.

---

## 5. Suggested phased roadmap

**Phase 1 — Content foundation**
M1 (editor), M2 (syntax highlighting), M3 (tags), C2 (reading time)
→ Posts become genuinely usable as dev content, tags enable future discovery features.

**Phase 2 — Control foundation** *(can run in parallel with Phase 1)*
M5 (roles), S1 (drafts/autosave)
→ Site is safe to open up to more authors/engagement without moderation gaps.

**Phase 3 — Engagement**
M6 (likes), S2 (nested replies), S7 (related posts), C5 (view counts)
→ Requires Phase 1 (tags for related posts) and benefits from Phase 2 (roles for future moderation).

**Phase 4 — Identity & social**
M4 (public profile), S4 (follow authors), C1 (bookmarks)
→ Builds on existing profile work from the UI redesign; low technical risk, mostly schema + view additions.

**Phase 5 — Moderation & notifications**
S6 (report/flag), S5 (admin dashboard), S3 (notifications)
→ Deliberately last: needs real engagement data (Phase 3) and roles (Phase 2) to be meaningful, and reporting/notifications are more valuable once there's actual volume to moderate/notify about.

**Backlog / opportunistic**
C3 (table of contents), C4 (RSS feed), C6 (email notifications) — pick these up whenever they fit a sprint; none block or are blocked by the phases above.

---

## 6. Sample user stories (one per Must-have, for scoping reference)

**US-1 — Rich content authoring**
> As an author, I want to write posts in markdown with a live preview, so I can format text and code without fighting a plain textarea.
- AC1: Editor supports headings, bold/italic, links, lists, and fenced code blocks.
- AC2: A live/toggleable preview shows rendered output before publishing.
- AC3: Existing posts (plain text) continue to render correctly — no data migration required.

**US-2 — Readable code snippets**
> As a reader, I want code blocks in posts to be syntax-highlighted, so technical content is actually legible.
- AC1: Fenced code blocks render with language-aware highlighting.
- AC2: Falls back to plain monospace if no language is specified — never breaks rendering.

**US-3 — Browse by topic**
> As a reader, I want to filter posts by tag, so I can find content on a specific technology or topic.
- AC1: Authors can assign one or more tags when creating/editing a post.
- AC2: Blog listing supports filtering by tag (works alongside existing search).
- AC3: Each tag has its own listing URL (shareable, bookmarkable).

**US-4 — Public author identity**
> As an author, I want a public profile page showing my bio and posts, so readers can discover more of my writing.
- AC1: Profile is viewable by anyone at a stable URL, not just the logged-in owner.
- AC2: Shows bio, avatar, joined date, and a list of the author's published posts.
- AC3: Draft posts never appear on the public profile.

**US-5 — Content moderation capability**
> As an admin, I want a role above regular users, so I can moderate content if something inappropriate is posted.
- AC1: A `role` field exists on the user schema (`reader`/`author`/`admin`).
- AC2: Admin-only actions (delete any post/comment, manage users) are protected by role check, not just ownership check.
- AC3: Regular users see no admin UI/controls.

**US-6 — Lightweight engagement**
> As a reader, I want to like a post, so I can show appreciation without writing a full comment.
- AC1: Logged-in users can like/unlike a post (toggle).
- AC2: Like count is visible on the post and in listings.
- AC3: Anonymous (logged-out) users see the count but are prompted to log in if they try to like.

---

## 7. Current scope 
  1. no email notification but inapp notification with notification icon . 
  2. No admin for now will in next phase but better to have in mind .
  3. defualt user will be reader and can create auther profile by self .
  4. for ui pov add prefilled text or data in write blog article editor . 
  5. all other mentioned in this plan

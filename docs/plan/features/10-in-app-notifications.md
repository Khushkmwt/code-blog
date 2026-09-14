# Feature 10 — In-app notifications (S3)

Source: features-plan.md S3 (in-app notifications), §7.1 (no email, in-app with a notification icon).

## Objective
Users get in-app notifications when someone engages with their content: a comment on their post,
a reply to their comment, or a like on their post. A bell icon in the navbar shows an unread badge;
the notifications page lists events, and opening it marks them as read (per §7.1, no email).

## Acceptance criteria
- S3-AC1: Comment → notify the post author (unless they commented on their own post).
- S3-AC2: Reply → notify the parent comment owner (unless they replied to themselves).
- S3-AC3: Like → notify the post author (unless they liked their own post); repeated like/unlike
  does not spam (single unread "like" notification is reused).
- S3-AC4: Navbar bell shows an unread count badge; page lists newest-first events; opening it marks
  all read; anon sees no bell.
- Notifications are private to the recipient (others get 404 on their page).

## Design
- `Notification` model: `user` (recipient), `type` ('comment' | 'reply' | 'like'), `actor`,
  `post`, `comment?`, `read` (Bool default false), timestamps.
- Navigation/unread surfaced via `res.locals.unreadNotifications` set in `authenticateUser`
  (lightweight count).
- Notification page `GET` lists + marks all read in one pass; no per-item read endpoint needed.

## Implementation steps
1. `models/notification.model.js` — new model (+ index on `user, read`).
2. `services/notification.service.js` — `createNotification`, `getNotifications`,
  `markAllRead`, `countUnread`; like-notifications deduped (upsert by actor+post when unread).
3. `middlewares/auth.middleware.js` — `authenticateUser` sets `res.locals.unreadNotifications`.
4. `services/comment.service.js` — after create: notify post author ('comment') or parent owner
   ('reply').
5. `services/post.service.js` — in `toggleLike`, notify post author on like-add ('like').
6. `controllers/user.controller.js` — `showNotifications` (list + mark read), renders page.
7. `routes/user.routes.js` — `GET /notifications` (no verifyJWT needed, handler checks auth).
8. Views: `views/users/notifications.ejs`; navbar bell (desktop + mobile) with unread badge.

## Verification
- `node --check` on touched files.
- Smoke: A publishes; B likes → A bell badge =1; B comments → badge =2; C replies to B's comment →
  B badge =1; opening notifications lists 3 events for A / 1 for B, clears badges; C's own
  comment/reply/like yield no notifications on own page; anon sees no bell; still-clean DB + uploads.
- Hex sweep clean.
import { asyncHandler } from "../utils/asyncHandler.js";
import { redirectWithFlash } from "../middlewares/flash.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { updateBioSchema } from "../schemas/user.schema.js";
import {
    getProfile,
    getPublicProfile,
    updateBio as updateBioService,
    becomeAuthor as becomeAuthorService,
    toggleFollow as toggleFollowService,
    toggleBookmark as toggleBookmarkService,
    getBookmarks as getBookmarksService,
} from "../services/user.service.js";
import {
    getNotifications,
    markAllRead,
} from "../services/notification.service.js";

const showProfile = asyncHandler(async (req, res) => {
    const { userprofile, posts, postCount, draftCount, commentCount, followerCount } = await getProfile(req.user?._id);
    const followingCount = req.user?.following?.length || 0;
    res.render('users/profile', {
        title: `${userprofile.name} — Profile`,
        userprofile,
        posts,
        postCount,
        draftCount,
        commentCount,
        isOwner: true,
        followerCount,
        followingCount,
    });
});

const showPublicProfile = asyncHandler(async (req, res) => {
    const viewer = res.locals.user;
    const viewerId = viewer?._id || null;
    const {
        userprofile,
        posts,
        postCount,
        commentCount,
        isFollowing,
        followerCount,
    } = await getPublicProfile(req.params.username, viewerId);

    if (viewer?._id && userprofile._id.toString() === viewer._id.toString()) {
        return res.redirect("/api/v1/users/profile");
    }

    res.render('users/profile', {
        title: `${userprofile.name} — Profile`,
        userprofile,
        posts,
        postCount,
        commentCount,
        isOwner: false,
        isPublic: true,
        isFollowing,
        followerCount,
    });
});

const toggleFollow = asyncHandler(async (req, res) => {
    await toggleFollowService({ followerId: req.user._id, targetId: req.params.id });
    res.redirect(req.get('Referer') || '/home');
});

const toggleBookmark = asyncHandler(async (req, res) => {
    await toggleBookmarkService({ userId: req.user._id, postId: req.params.postId });
    res.redirect(req.get('Referer') || `/api/v1/blog/show/${req.params.postId}`);
});

const showBookmarks = asyncHandler(async (req, res) => {
    const viewer = res.locals.user;
    if (!viewer?._id) {
        return res.redirect("/api/v1/users/login");
    }
    const posts = await getBookmarksService(viewer._id);
    res.render('users/bookmarks', {
        title: 'Saved posts',
        posts,
    });
});

const showNotifications = asyncHandler(async (req, res) => {
    const viewer = res.locals.user;
    if (!viewer?._id) {
        return res.redirect("/api/v1/users/login");
    }
    const notifications = await getNotifications(viewer._id);
    await markAllRead(viewer._id);
    res.render('users/notifications', {
        title: 'Notifications',
        notifications,
    });
});

const updateBio = [
    validate(updateBioSchema),
    asyncHandler(async (req, res) => {
        await updateBioService({ userId: req.user._id, bio: req.body.bio });
        redirectWithFlash(res, "/api/v1/users/profile", 'success', 'Bio updated.');
    }),
];

const becomeAuthor = asyncHandler(async (req, res) => {
    await becomeAuthorService(req.user?._id);
    redirectWithFlash(res, "/api/v1/users/profile", 'success', 'You are now an author — start writing!');
});

export { showProfile, showPublicProfile, updateBio, becomeAuthor, toggleFollow, toggleBookmark, showBookmarks, showNotifications };
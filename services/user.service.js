import { User } from "../models/user.model.js";
import { Post } from "../models/post.model.js";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ROLES } from "../config/constants.js";

const getProfile = async (userId) => {
    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, "User not found");

    const userprofile = {
        _id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        profilePicture: user.coverImg,
        role: user.role,
        bio: user.bio || '',
        joinedAt: user.createdAt
    };

    const posts = await Post.find({ author: user._id }).sort({ createdAt: -1 });
    const postCount = posts.filter((post) => post.status === 'published').length;
    const draftCount = posts.filter((post) => post.status === 'draft').length;
    const commentCount = await Comment.countDocuments({ owner: user._id });
    const followerCount = await User.countDocuments({ following: userId });

    return { userprofile, posts, postCount, draftCount, commentCount, followerCount };
};

const getPublicProfile = async (username, viewerId = null) => {
    const user = await User.findOne({ username }).select('-password -refreshToken');
    if (!user) throw new ApiError(404, "User not found");

    const posts = await Post.find({ author: user._id, status: 'published' }).sort({ createdAt: -1 });
    const commentCount = await Comment.countDocuments({ owner: user._id });
    const followerCount = await User.countDocuments({ following: user._id });

    const userprofile = {
        _id: user._id,
        name: user.name,
        username: user.username,
        profilePicture: user.coverImg,
        role: user.role,
        bio: user.bio || '',
        joinedAt: user.createdAt,
        followerCount,
    };

    let isFollowing = false;
    if (viewerId && user._id.toString() !== viewerId.toString()) {
        const viewer = await User.findById(viewerId).select('following');
        isFollowing = !!(viewer?.following &&
            viewer.following.some((id) => id && id.toString() === user._id.toString()));
    }

    return {
        userprofile,
        posts,
        postCount: posts.length,
        commentCount,
        isFollowing,
        followerCount,
    };
};

const toggleFollow = async ({ followerId, targetId }) => {
    if (followerId.toString() === targetId.toString()) {
        throw new ApiError(400, "You can’t follow yourself");
    }
    const target = await User.findById(targetId).select('-password -refreshToken');
    if (!target) throw new ApiError(404, "User not found");

    const follower = await User.findById(followerId).select('-password -refreshToken');
    const has = follower.following.some((id) => id.toString() === targetId.toString());
    const update = has
        ? { $pull: { following: targetId } }
        : { $addToSet: { following: targetId } };
    await User.findByIdAndUpdate(followerId, update);
    return { following: !has };
};

const getFollowFeed = async (userId, limit = 3) => {
    const user = await User.findById(userId).select('following');
    const ids = (user?.following || []);
    if (!ids.length) return [];
    return Post.find({ status: 'published', author: { $in: ids } })
        .populate('author', 'name username')
        .sort({ createdAt: -1 })
        .limit(limit);
};

const toggleBookmark = async ({ userId, postId }) => {
    const post = await Post.findById(postId);
    if (!post || post.status !== 'published') throw new ApiError(404, "Post not found");

    const user = await User.findById(userId).select('-password -refreshToken');
    const has = user.bookmarks.some((id) => id.toString() === postId.toString());
    const update = has
        ? { $pull: { bookmarks: postId } }
        : { $addToSet: { bookmarks: postId } };
    await User.findByIdAndUpdate(userId, update);
    return { bookmarked: !has };
};

const getBookmarks = async (userId) => {
    const user = await User.findById(userId).select('bookmarks');
    return Post.find({ _id: { $in: user?.bookmarks || [] }, status: 'published' })
        .populate('author', 'name username')
        .sort({ createdAt: -1 });
};

const updateBio = async ({ userId, bio }) => {
    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, "User not found");
    user.bio = (bio || '').trim().slice(0, 160);
    await user.save({ validateBeforeSave: false });
    return user;
};

const becomeAuthor = async (userId) => {
    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, "User not found");

    if (user.role === ROLES.ADMIN) return user;

    user.role = ROLES.AUTHOR;
    await user.save({ validateBeforeSave: false });
    return user;
};

export { getProfile, getPublicProfile, updateBio, becomeAuthor, toggleFollow, getFollowFeed, toggleBookmark, getBookmarks };
import { Post } from "../models/post.model.js";
import { User } from "../models/user.model.js";

export const getHomeSummary = async () => {
    const [latestPosts, postsCount, usersCount] = await Promise.all([
        Post.find({ status: 'published' }).populate('author', 'name username').sort({ createdAt: -1 }).limit(3),
        Post.countDocuments({ status: 'published' }),
        User.countDocuments(),
    ]);
    return { latestPosts, postsCount, usersCount };
};
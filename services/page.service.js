import { Post } from "../models/post.model.js";
import { User } from "../models/user.model.js";

export const getHomeSummary = async () => {
    const [latestPosts, postsCount, usersCount] = await Promise.all([
        Post.find({}).populate('author', 'name').sort({ createdAt: -1 }).limit(3),
        Post.countDocuments(),
        User.countDocuments(),
    ]);
    return { latestPosts, postsCount, usersCount };
};
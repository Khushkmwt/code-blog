import { User } from "../models/user.model.js";
import { Post } from "../models/post.model.js";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";

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
        joinedAt: user.createdAt
    };

    const posts = await Post.find({ author: user._id }).sort({ createdAt: -1 });
    const postCount = posts.length;
    const commentCount = await Comment.countDocuments({ owner: user._id });

    return { userprofile, posts, postCount, commentCount };
};

export { getProfile };
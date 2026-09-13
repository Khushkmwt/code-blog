import { Post } from "../models/post.model.js";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";

const POSTS_PER_PAGE = 6;

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const isDuplicateKeyError = (err) => err?.code === 11000;

const throwIfNotOwnedBy = (post, userId) => {
    if (!post) throw new ApiError(404, "post not found");
    if (post.author.toString() !== userId.toString()) {
        throw new ApiError(403, "you can only update your own posts");
    }
};

const listPosts = async ({ search = '', page = 1 }) => {
    const cleanSearch = search.slice(0, 80);

    const query = {};
    if (cleanSearch) {
        const rx = new RegExp(escapeRegex(cleanSearch), 'i');
        query.$or = [{ title: rx }, { desc: rx }];
    }

    const [posts, totalPosts] = await Promise.all([
        Post.find(query)
            .populate('author', 'name')
            .sort({ createdAt: -1 })
            .skip((POSTS_PER_PAGE * page) - POSTS_PER_PAGE)
            .limit(POSTS_PER_PAGE),
        Post.countDocuments(query)
    ]);

    const totalPages = Math.max(1, Math.ceil(totalPosts / POSTS_PER_PAGE));

    return {
        posts,
        totalPosts,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        search: cleanSearch,
    };
};

const getPostById = async (id) => {
    const post = await Post.findById(id).populate('author', 'name');
    if (!post) throw new ApiError(404, 'Post not found');

    const comments = await Comment.find({ post: id }).populate('owner', 'name').sort({ createdAt: -1 });

    return { post, comments };
};

const getOwnPost = async ({ postId, userId }) => {
    const post = await Post.findById(postId);
    throwIfNotOwnedBy(post, userId);
    return post;
};

const createPost = async ({ title, desc, detail, authorId }) => {
    let post;
    try {
        post = await Post.create({ title, desc, detail, author: authorId });
    } catch (err) {
        if (isDuplicateKeyError(err)) throw new ApiError(409, "A post with that title already exists");
        throw err;
    }
    if (!post) throw new ApiError(400, "post not created");
    return post;
};

const updatePost = async ({ postId, userId, title, desc, detail }) => {
    const post = await Post.findById(postId);
    throwIfNotOwnedBy(post, userId);

    let updatedPost;
    try {
        updatedPost = await Post.findByIdAndUpdate(postId, { title, desc, detail }, {
            returnDocument: 'after',
            runValidators: true
        });
    } catch (err) {
        if (isDuplicateKeyError(err)) throw new ApiError(409, "A post with that title already exists");
        throw err;
    }

    if (!updatedPost) throw new ApiError(400, "post not found");
    return updatedPost;
};

const deletePost = async ({ postId, userId }) => {
    const post = await Post.findById(postId);
    if (!post) throw new ApiError(404, "Post not found");
    if (post.author.toString() !== userId.toString()) {
        throw new ApiError(403, "You can only delete your own posts");
    }

    await Comment.deleteMany({ post: post._id });
    await Post.findByIdAndDelete(postId);
};

export { listPosts, getPostById, getOwnPost, createPost, updatePost, deletePost };
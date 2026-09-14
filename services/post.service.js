import { Post } from "../models/post.model.js";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { createNotification } from "./notification.service.js";

const POSTS_PER_PAGE = 6;

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const isDuplicateKeyError = (err) => err?.code === 11000;

const throwIfNotOwnedBy = (post, userId) => {
    if (!post) throw new ApiError(404, "post not found");
    if (post.author.toString() !== userId.toString()) {
        throw new ApiError(403, "you can only update your own posts");
    }
};

const listPosts = async ({ search = '', page = 1, tag = '' }) => {
    const cleanSearch = search.slice(0, 80);
    const cleanTag = tag.trim().toLowerCase().slice(0, 30);

    const query = { status: 'published' };
    if (cleanSearch) {
        const rx = new RegExp(escapeRegex(cleanSearch), 'i');
        query.$or = [{ title: rx }, { desc: rx }];
    }
    if (cleanTag) query.tags = cleanTag;

    const [posts, totalPosts] = await Promise.all([
        Post.find(query)
            .populate('author', 'name username')
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
        tag: cleanTag,
    };
};

const getPostById = async (id) => {
    const post = await Post.findById(id).populate('author', 'name username');
    if (!post) throw new ApiError(404, 'Post not found');

    const all = await Comment.find({ post: id })
        .populate('owner', 'name')
        .sort({ createdAt: 1 });

    const children = {};
    const topLevel = [];
    for (const comment of all) {
        const cid = comment._id.toString();
        if (comment.parent) {
            const key = comment.parent.toString();
            if (!children[key]) children[key] = [];
            children[key].push(comment.toObject());
            children[key][children[key].length - 1].owner = comment.owner;
        } else {
            topLevel.push(comment);
        }
    }

    const comments = topLevel
        .sort((a, b) => b.createdAt - a.createdAt)
        .map((comment) => {
            const item = comment.toObject();
            item.owner = comment.owner;
            item.replies = children[item._id.toString()] || [];
            return item;
        });

    return { post, comments };
};

const getRelatedPosts = async ({ postId, tags, limit = 3 }) => {
    if (!tags || !tags.length) return [];

    const candidates = await Post.find({
        _id: { $ne: postId },
        status: 'published',
        tags: { $in: tags },
    })
        .populate('author', 'name username')
        .limit(Math.max(limit * 4, 12));

    return candidates
        .map((post) => {
            const overlap = (post.tags || []).reduce(
                (n, tag) => (tags.includes(tag) ? n + 1 : n), 0);
            return { post, overlap };
        })
        .sort((a, b) => b.overlap - a.overlap || b.post.createdAt - a.post.createdAt)
        .slice(0, limit)
        .map(({ post }) => post);
};

const getOwnPost = async ({ postId, userId }) => {
    const post = await Post.findById(postId);
    throwIfNotOwnedBy(post, userId);
    return post;
};

const createPost = async ({ title, desc, detail, tags = [], status = 'published', draftId, authorId }) => {
    if (draftId) {
        const draft = await Post.findById(draftId);
        throwIfNotOwnedBy(draft, authorId);
        return Post.findByIdAndUpdate(draftId, {
            title,
            desc,
            detail,
            tags,
            status: 'published',
        }, { returnDocument: 'after', runValidators: true });
    }

    let post;
    try {
        post = await Post.create({ title, desc, detail, tags, status, author: authorId });
    } catch (err) {
        if (isDuplicateKeyError(err)) throw new ApiError(409, "A post with that title already exists");
        throw err;
    }
    if (!post) throw new ApiError(400, "post not created");
    return post;
};

const draftPost = async ({ title, desc = '', detail = '', tags = [], draftId, authorId }) => {
    if (draftId) {
        const draft = await Post.findById(draftId);
        throwIfNotOwnedBy(draft, authorId);
        return Post.findByIdAndUpdate(draftId, { title, desc, detail, tags }, {
            returnDocument: 'after',
            runValidators: true,
        });
    }

    let post;
    try {
        post = await Post.create({ title, desc, detail, tags, status: 'draft', author: authorId });
    } catch (err) {
        if (isDuplicateKeyError(err)) throw new ApiError(409, "A draft with that title already exists");
        throw err;
    }
    if (!post) throw new ApiError(400, "draft not created");
    return post;
};

const updatePost = async ({ postId, userId, title, desc, detail, tags, status = 'published' }) => {
    const post = await Post.findById(postId);
    throwIfNotOwnedBy(post, userId);

    const update = { title, desc, detail, status };
    if (tags) update.tags = tags;

    let updatedPost;
    try {
        updatedPost = await Post.findByIdAndUpdate(postId, update, {
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

const toggleLike = async ({ postId, userId }) => {
    const post = await Post.findById(postId);
    if (!post || post.status !== 'published') throw new ApiError(404, "Post not found");

    const hasLiked = post.likes.some((id) => id.toString() === userId.toString());
    const update = hasLiked
        ? { $pull: { likes: userId } }
        : { $addToSet: { likes: userId } };

    await Post.findByIdAndUpdate(postId, update);

    if (!hasLiked) {
        await createNotification({
            user: post.author,
            actor: userId,
            type: 'like',
            post: postId,
        });
    }

    return { liked: !hasLiked, likeCount: post.likes.length + (hasLiked ? -1 : 1) };
};

const incrementViews = async (postId) => {
    return Post.findByIdAndUpdate(postId, { $inc: { views: 1 } });
};

export { listPosts, getPostById, getOwnPost, createPost, draftPost, updatePost, deletePost, toggleLike, incrementViews, getRelatedPosts };
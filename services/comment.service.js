import { Comment } from "../models/comment.model.js";
import { Post } from "../models/post.model.js";
import { ApiError } from "../utils/ApiError.js";
import { createNotification } from "./notification.service.js";

const throwIfNotOwnedBy = (comment, userId) => {
    if (!comment) throw new ApiError(404, "comment not found");
    if (comment.owner.toString() !== userId.toString()) {
        throw new ApiError(403, "you can only edit your own comments");
    }
};

const createComment = async ({ postId, ownerId, content, parentId = null }) => {
    let parent = null;
    if (parentId) {
        parent = await Comment.findById(parentId);
        if (!parent || parent.post.toString() !== postId.toString()) {
            throw new ApiError(400, "You can only reply to comments on this post");
        }
        if (parent.parent) {
            throw new ApiError(400, "Replies can only go one level deep");
        }
    }

    const newComment = await Comment.create({
        content,
        post: postId,
        owner: ownerId,
        parent: parentId || null,
    });

    if (parent) {
        await createNotification({
            user: parent.owner,
            actor: ownerId,
            type: 'reply',
            post: postId,
            comment: newComment._id,
        });
    } else {
        const post = await Post.findById(postId).select('author');
        if (post) {
            await createNotification({
                user: post.author,
                actor: ownerId,
                type: 'comment',
                post: postId,
                comment: newComment._id,
            });
        }
    }

    return newComment;
};

const getCommentById = async (commentId) => {
    const comment = await Comment.findById(commentId);
    if (!comment) throw new ApiError(404, "comment not found");
    return comment;
};

const getOwnComment = async ({ commentId, ownerId }) => {
    const comment = await getCommentById(commentId);
    throwIfNotOwnedBy(comment, ownerId);
    return comment;
};

const editComment = async ({ commentId, ownerId, content }) => {
    const comment = await getOwnComment({ commentId, ownerId });
    comment.content = content;
    await comment.save();
    return comment;
};

const deleteComment = async ({ commentId, ownerId }) => {
    const comment = await getOwnComment({ commentId, ownerId });
    const postId = comment.post;
    await Comment.findByIdAndDelete(commentId);
    return postId;
};

export { createComment, editComment, deleteComment, getOwnComment };
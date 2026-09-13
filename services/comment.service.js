import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";

const throwIfNotOwnedBy = (comment, userId) => {
    if (!comment) throw new ApiError(404, "comment not found");
    if (comment.owner.toString() !== userId.toString()) {
        throw new ApiError(403, "you can only edit your own comments");
    }
};

const createComment = async ({ postId, ownerId, content }) => {
    const newComment = await Comment.create({
        content,
        post: postId,
        owner: ownerId
    });
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
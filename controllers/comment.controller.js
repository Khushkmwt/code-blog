import { asyncHandler } from "../utils/asyncHandler.js";
import { redirectWithFlash } from "../middlewares/flash.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { createCommentSchema } from "../schemas/comment.schema.js";
import {
    createComment as createCommentService,
    editComment as editCommentService,
    deleteComment as deleteCommentService,
    getOwnComment,
} from "../services/comment.service.js";

const createComment = [
    validate(createCommentSchema),
    asyncHandler(async (req, res) => {
        await createCommentService({
            postId: req.params.id,
            ownerId: req.user.id,
            content: req.body.comment,
            parentId: req.body.parent || null,
        });

        redirectWithFlash(res, `/api/v1/blog/show/${req.params.id}`, 'success', 'Comment added.');
    }),
];

const renderEditCommentPage = asyncHandler(async (req, res) => {
    const comment = await getOwnComment({ commentId: req.params.id, ownerId: req.user._id });
    res.render('comments/edit', { title: 'Edit comment', comment });
});

const editComment = [
    validate(createCommentSchema),
    asyncHandler(async (req, res) => {
        const updated = await editCommentService({
            commentId: req.params.id,
            ownerId: req.user._id,
            content: req.body.comment,
        });

        redirectWithFlash(res, `/api/v1/blog/show/${updated.post}`, 'success', 'Comment updated.');
    }),
];

const deleteComment = asyncHandler(async (req, res) => {
    const postId = await deleteCommentService({ commentId: req.params.id, ownerId: req.user._id });
    redirectWithFlash(res, `/api/v1/blog/show/${postId}`, 'success', 'Comment deleted.');
});

export {
    createComment,
    editComment,
    deleteComment,
    renderEditCommentPage,
};
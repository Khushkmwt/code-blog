import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { createComment, editComment, deleteComment, renderEditCommentPage } from "../controllers/comment.controller.js";

const router = Router();

router.route("/:id")
    .post(verifyJWT, createComment);

router.route("/edit/:id")
    .get(verifyJWT, renderEditCommentPage)
    .post(verifyJWT, editComment);

router.route("/delete/:id")
    .post(verifyJWT, deleteComment);

export default router;
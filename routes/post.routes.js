import { Router } from "express";
import { verifyJWT, requireRole } from "../middlewares/auth.middleware.js";
import { ROLES } from "../config/constants.js";
import {
    createPost,
    saveDraft,
    updatePost,
    deletePost,
    toggleLikePost,
    renderCreatePostPage,
    renderUpdatePostPage,
} from "../controllers/post.controller.js";

const router = Router();
const authorOnly = [verifyJWT, requireRole(ROLES.AUTHOR)];

router.route("/create")
    .get(verifyJWT, renderCreatePostPage)
    .post(authorOnly, createPost);

router.post("/draft", authorOnly, saveDraft);

router.route("/update/:id")
    .get(authorOnly, renderUpdatePostPage)
    .post(authorOnly, updatePost);

router.route("/delete/:id")
    .post(authorOnly, deletePost);

router.route("/like/:id")
    .post(verifyJWT, toggleLikePost);

export default router;
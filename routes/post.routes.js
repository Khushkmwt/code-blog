import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    createPost,
    updatePost,
    deletePost,
    renderCreatePostPage,
    renderUpdatePostPage,
} from "../controllers/post.controller.js";

const router = Router();

router.route("/create")
    .get(renderCreatePostPage)
    .post(verifyJWT, createPost);

router.route("/update/:id")
    .get(verifyJWT, renderUpdatePostPage)
    .post(verifyJWT, updatePost);

router.route("/delete/:id")
    .post(verifyJWT, deletePost);

export default router;
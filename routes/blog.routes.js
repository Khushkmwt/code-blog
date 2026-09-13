import { Router } from "express";
import { listPostsHandler, showPost } from "../controllers/post.controller.js";

const router = Router();

router.get("/", listPostsHandler);
router.get("/show/:id", showPost);

export default router;
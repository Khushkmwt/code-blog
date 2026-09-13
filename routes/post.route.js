import { createpost, updatePost, deletePost } from "../controllers/post.controller.js";
import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { Post } from "../models/post.model.js";

const router = Router();

router.post("/create", verifyJWT, createpost);

router.get("/create", (req, res) => {
    const isLoggedIn = res.locals.isLoggedIn
    if (!isLoggedIn) {
        return res.redirect("/api/v1/users/login")
    }
    res.render("createpost", { title: "Write a post", isLoggedIn });
});

router.get("/update/:id", verifyJWT, async (req, res) => {
    const post = await Post.findById(req.params.id)
    if (!post) {
        return res.status(404).send("Post not found")
    }
    if (post.author.toString() !== req.user._id.toString()) {
        return res.status(403).send("You can only update your own posts")
    }
    res.render("updatepost", { title: `Edit — ${post.title}`, post, isLoggedIn: res.locals.isLoggedIn })
})
router.post("/update/:id", verifyJWT, updatePost)
router.post("/delete/:id", verifyJWT, deletePost)

export default router;
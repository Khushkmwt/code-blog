import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    showProfile,
    showPublicProfile,
    updateBio,
    becomeAuthor,
    toggleFollow,
    toggleBookmark,
    showBookmarks,
    showNotifications,
} from "../controllers/user.controller.js";

const router = Router();

router.route("/profile").get(verifyJWT, showProfile);
router.route("/bio").post(verifyJWT, updateBio);
router.route("/become-author").post(verifyJWT, becomeAuthor);
router.route("/follow/:id").post(verifyJWT, toggleFollow);
router.route("/bookmark/:postId").post(verifyJWT, toggleBookmark);
router.route("/bookmarks").get(showBookmarks);
router.route("/notifications").get(showNotifications);
router.route("/u/:username").get(showPublicProfile);

export default router;
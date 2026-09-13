import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    renderSignupPage,
    renderLoginPage,
    renderChangePasswordPage,
} from "../controllers/auth.controller.js";

const router = Router();

router.route("/register")
    .get(renderSignupPage)
    .post(upload.single('avatar'), registerUser);

router.route("/login")
    .get(renderLoginPage)
    .post(loginUser);

router.route("/change-password")
    .get(renderChangePasswordPage)
    .post(verifyJWT, changeCurrentPassword);

router.route("/logout").post(verifyJWT, logoutUser);

router.route("/refresh-token").post(refreshAccessToken);

export default router;
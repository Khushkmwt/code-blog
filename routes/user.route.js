import { Router } from "express";
import {upload} from '../middleware/multer.middleware.js'
import {
    loginUser,
    logoutUser,
    registerUser,
    refreshAccessToken,
    changeCurrentPassword,
    showUser
} from "../controllers/user.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
const router = Router()

router.route("/register").get(
    (req, res) => {
        res.render("signup",{ title: "Create an account", isLoggedIn: res.locals.isLoggedIn })
    }
)
.post(
    upload.single('avatar'),
    registerUser
    )

router.route("/login").post(
    loginUser
).get(
    (req, res) => {
        res.render("login",{ title: "Log in", isLoggedIn: res.locals.isLoggedIn })
    }
)
router.route("/profile").get(verifyJWT, showUser)
//secured routes
router.route("/change-password")
.get((req, res) => {
    if (!res.locals.isLoggedIn) {
        return res.redirect("/api/v1/users/login")
    }
    res.render("changepass",{ title: "Change password", isLoggedIn: res.locals.isLoggedIn })
})
.post(verifyJWT, changeCurrentPassword)

router.route("/logout").post(verifyJWT, logoutUser)
router.route("/refresh-token").post(refreshAccessToken)

export default router
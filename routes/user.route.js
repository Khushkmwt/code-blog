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
        res.render("signup.ejs",{ isLoggedIn: res.locals.isLoggedIn })
    }
)
.post(
    upload.single('avatar'),
    registerUser,
    (req, res) => {
        res.redirect("/home",{ isLoggedIn: res.locals.isLoggedIn })
    }
    )

router.route("/login",).post(
    loginUser
).get(
    (req, res) => {
        res.render("login.ejs",{ isLoggedIn: res.locals.isLoggedIn })
    }
)
router.route("/profile").get(verifyJWT,showUser)
//secured routes
router.route("/logout").post( logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(verifyJWT, changeCurrentPassword)
export default router
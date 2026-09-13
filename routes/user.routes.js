import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { showProfile } from "../controllers/user.controller.js";

const router = Router();

router.route("/profile").get(verifyJWT, showProfile);

export default router;
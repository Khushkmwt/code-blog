
import { createComment, deleteComment, editComment, renderEditform } from "../controllers/comment.controller.js";
import {verifyJWT} from "../middleware/auth.middleware.js"
import { Router } from "express";
const router = Router()

router.post("/:id",verifyJWT,createComment)
router.get("/edit/:id",verifyJWT,renderEditform)
router.post("/edit/:id",verifyJWT,editComment)
router.post("/delete/:id",verifyJWT,deleteComment)
export default router
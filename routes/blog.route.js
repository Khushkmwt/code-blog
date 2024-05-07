import { Post } from "../models/post.model.js";
import { Router } from "express"; 
import {showPost} from "../controllers/post.controller.js"
import { verifyJWT } from "../middleware/auth.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

// GET /blog

router.get('/', asyncHandler(async (req, res) => {
        const perPage = 3; // Number of posts per page
        const page = parseInt(req.query.page) || 1; // Current page, default is 1
    
        const posts = await Post.find({})
            .populate('author', 'name')
            .skip((perPage * page) - perPage)
            .limit(perPage);
    
        const totalPosts = await Post.countDocuments();
        const totalPages = Math.ceil(totalPosts / perPage);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;
    
        res.render('blog', { isLoggedIn: res.locals.isLoggedIn, posts, currentPage: page, hasNextPage, hasPrevPage });
    }));

router.get('/show/:id', showPost)

export default router;
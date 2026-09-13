import { Post } from "../models/post.model.js";
import { Router } from "express";
import {showPost} from "../controllers/post.controller.js"
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// GET /blog
router.get('/', asyncHandler(async (req, res) => {
        const perPage = 6;
        const rawPage = parseInt(req.query.page, 10);
        const page = Math.max(1, Number.isFinite(rawPage) ? rawPage : 1);

        const search = (typeof req.query.search === 'string' ? req.query.search.trim() : '').slice(0, 80);

        const query = {};
        if (search) {
            const rx = new RegExp(escapeRegex(search), 'i');
            query.$or = [{ title: rx }, { desc: rx }];
        }

        const [posts, totalPosts] = await Promise.all([
            Post.find(query)
                .populate('author', 'name')
                .sort({ createdAt: -1 })
                .skip((perPage * page) - perPage)
                .limit(perPage),
            Post.countDocuments(query)
        ]);

        const totalPages = Math.max(1, Math.ceil(totalPosts / perPage));
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;

        res.render('blog', {
            title: search ? `Search: "${search}"` : 'Blog',
            isLoggedIn: res.locals.isLoggedIn,
            posts,
            search,
            currentPage: page,
            totalPages,
            totalPosts,
            hasNextPage,
            hasPrevPage
        });
    }));

router.get('/show/:id', showPost)

export default router;
import { asyncHandler } from "../utils/asyncHandler.js";
import { redirectWithFlash } from "../middlewares/flash.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { createPostSchema, updatePostSchema } from "../schemas/post.schema.js";
import {
    listPosts,
    getPostById,
    getOwnPost,
    createPost as createPostService,
    updatePost as updatePostService,
    deletePost as deletePostService,
} from "../services/post.service.js";

const parsePage = (value) => {
    const rawPage = parseInt(value, 10);
    return Math.max(1, Number.isFinite(rawPage) ? rawPage : 1);
};

const listPostsHandler = asyncHandler(async (req, res) => {
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const page = parsePage(req.query.page);

    const result = await listPosts({ search, page });

    res.render('posts/list', {
        title: search ? `Search: "${search}"` : 'Blog',
        ...result,
        currentPage: page,
    });
});

const showPost = asyncHandler(async (req, res) => {
    const { post, comments } = await getPostById(req.params.id);
    res.render('posts/detail', {
        title: post.title,
        post,
        currentUser: res.locals.user,
        comments,
    });
});

const createPost = [
    validate(createPostSchema),
    asyncHandler(async (req, res) => {
        const post = await createPostService({
            title: req.body.title,
            desc: req.body.desc,
            detail: req.body.detail,
            authorId: req.user._id,
        });

        redirectWithFlash(res, `/api/v1/blog/show/${post._id}`, 'success', `"${post.title}" was published.`);
    }),
];

const updatePost = [
    validate(updatePostSchema),
    asyncHandler(async (req, res) => {
        const updatedPost = await updatePostService({
            postId: req.params.id,
            userId: req.user._id,
            title: req.body.title,
            desc: req.body.desc,
            detail: req.body.detail,
        });

        redirectWithFlash(res, `/api/v1/blog/show/${updatedPost._id}`, 'success', 'Post updated.');
    }),
];

const deletePost = asyncHandler(async (req, res) => {
    await deletePostService({ postId: req.params.id, userId: req.user._id });
    redirectWithFlash(res, "/home", 'success', 'Post deleted.');
});

const renderCreatePostPage = (req, res) => {
    if (!res.locals.isLoggedIn) {
        return res.redirect("/api/v1/users/login");
    }
    res.render('posts/create', { title: 'Write a post' });
};

const renderUpdatePostPage = asyncHandler(async (req, res) => {
    const post = await getOwnPost({ postId: req.params.id, userId: req.user._id });
    res.render('posts/edit', { title: `Edit — ${post.title}`, post });
});

export {
    listPostsHandler,
    showPost,
    createPost,
    updatePost,
    deletePost,
    renderCreatePostPage,
    renderUpdatePostPage,
};
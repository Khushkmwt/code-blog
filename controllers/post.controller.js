import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { redirectWithFlash } from "../middlewares/flash.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { createPostSchema, updatePostSchema, draftPostSchema } from "../schemas/post.schema.js";
import { ROLES } from "../config/constants.js";
import { renderMarkdown } from "../utils/markdown.js";
import { readingMinutes } from "../utils/reading-time.js";
import {
    listPosts,
    getPostById,
    getOwnPost,
    createPost as createPostService,
    draftPost as draftPostService,
    updatePost as updatePostService,
    deletePost as deletePostService,
    toggleLike as toggleLikeService,
    incrementViews,
    getRelatedPosts,
} from "../services/post.service.js";

const EDITOR_SCRIPTS = [
    'https://cdn.jsdelivr.net/npm/markdown-it@14.1.0/dist/markdown-it.min.js',
    '/editor.js',
];

const DRAFT_SCRIPTS = [
    ...EDITOR_SCRIPTS,
    '/drafts.js',
];

const parsePage = (value) => {
    const rawPage = parseInt(value, 10);
    return Math.max(1, Number.isFinite(rawPage) ? rawPage : 1);
};

const listPostsHandler = asyncHandler(async (req, res) => {
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const tag = typeof req.query.tag === 'string' ? req.query.tag.trim() : '';
    const page = parsePage(req.query.page);

    const result = await listPosts({ search, page, tag });

    res.render('posts/list', {
        title: tag ? `Tagged: ${tag}` : (search ? `Search: "${search}"` : 'Blog'),
        ...result,
        currentPage: page,
    });
});

const showPost = asyncHandler(async (req, res) => {
    const { post, comments } = await getPostById(req.params.id);

    const viewer = res.locals.user;
    const isOwner = !!(viewer && post.author?._id && viewer._id &&
        post.author._id.toString() === viewer._id.toString());

    if (post.status === 'draft' && !isOwner) {
        throw new ApiError(404, 'Post not found');
    }

    if (post.status === 'published') {
        await incrementViews(post._id);
        post.views = (post.views || 0) + 1;
    }

    const relatedPosts = post.status === 'published'
        ? await getRelatedPosts({ postId: post._id, tags: post.tags || [] })
        : [];

    const bookmarked = !!(viewer?.bookmarks &&
        viewer.bookmarks.some((id) => post._id && id.toString() === post._id.toString()));

    res.render('posts/detail', {
        title: post.title,
        post,
        currentUser: res.locals.user,
        comments,
        relatedPosts,
        bookmarked,
        contentHtml: renderMarkdown(post.detail),
        readMinutes: readingMinutes(post.detail),
        highlight: true,
        isDraft: post.status === 'draft',
    });
});

const createPost = [
    validate(createPostSchema),
    asyncHandler(async (req, res) => {
        const post = await createPostService({
            title: req.body.title,
            desc: req.body.desc,
            detail: req.body.detail,
            tags: req.body.tags,
            status: req.body.status,
            draftId: req.body.draftId,
            authorId: req.user._id,
        });

        const isDraft = post.status === 'draft';
        const msg = isDraft ? 'Draft saved.' : `"${post.title}" was published.`;
        const dest = isDraft ? `/api/v1/post/update/${post._id}` : `/api/v1/blog/show/${post._id}`;
        redirectWithFlash(res, dest, 'success', msg);
    }),
];

const saveDraft = [
    validate(draftPostSchema),
    asyncHandler(async (req, res) => {
        const post = await draftPostService({
            title: req.body.title,
            desc: req.body.desc,
            detail: req.body.detail,
            tags: req.body.tags,
            draftId: req.body.draftId,
            authorId: req.user._id,
        });

        res.status(200).json(new ApiResponse(200, { postId: post._id }, 'Draft saved'));
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
            tags: req.body.tags,
            status: req.body.status,
        });

        redirectWithFlash(res, `/api/v1/blog/show/${updatedPost._id}`, 'success',
            updatedPost.status === 'draft' ? 'Draft saved.' : 'Post updated.');
    }),
];

const deletePost = asyncHandler(async (req, res) => {
    await deletePostService({ postId: req.params.id, userId: req.user._id });
    redirectWithFlash(res, "/home", 'success', 'Post deleted.');
});

const toggleLikePost = asyncHandler(async (req, res) => {
    await toggleLikeService({ postId: req.params.id, userId: req.user._id });
    redirectWithFlash(res, `/api/v1/blog/show/${req.params.id}`, 'success', 'Thanks for the reaction!');
});

const renderCreatePostPage = (req, res) => {
    if (!res.locals.isLoggedIn) {
        return res.redirect("/api/v1/users/login");
    }
    if (res.locals.user?.role !== ROLES.AUTHOR) {
        return redirectWithFlash(res, "/api/v1/users/profile", 'info', 'Become an author to write posts.');
    }
    res.render('posts/create', {
        title: 'Write a post',
        highlight: true,
        pageScripts: DRAFT_SCRIPTS,
    });
};

const renderUpdatePostPage = asyncHandler(async (req, res) => {
    if (res.locals.user?.role !== ROLES.AUTHOR) {
        return redirectWithFlash(res, "/api/v1/users/profile", 'info', 'Become an author to write posts.');
    }
    const post = await getOwnPost({ postId: req.params.id, userId: req.user._id });
    res.render('posts/edit', {
        title: `Edit — ${post.title}`,
        post,
        isDraft: post.status === 'draft',
        highlight: true,
        pageScripts: DRAFT_SCRIPTS,
    });
});

export {
    listPostsHandler,
    showPost,
    createPost,
    saveDraft,
    updatePost,
    deletePost,
    toggleLikePost,
    renderCreatePostPage,
    renderUpdatePostPage,
};
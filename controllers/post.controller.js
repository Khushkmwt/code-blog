import { asyncHandler } from "../utils/asyncHandler.js";
import {Post} from "../models/post.model.js";
import {ApiError} from "../utils/ApiError.js";
import { Comment } from "../models/comment.model.js";
import { setFlash } from "../middleware/flash.middleware.js";

const isDuplicateKeyError = (err) => err?.code === 11000;

const trimOrEmpty = (value) => (typeof value === 'string' ? value.trim() : '');

const createpost = asyncHandler(async(req,res) =>{

    const title = trimOrEmpty(req.body.title);
    const desc = trimOrEmpty(req.body.desc);
    const detail = trimOrEmpty(req.body.detail);

    if (!title) throw new ApiError(400, "Title is required");
    if (!desc) throw new ApiError(400, "Description is required");
    if (!detail) throw new ApiError(400, "Details are required");

    const user = req.user._id;
    if (!user) throw new ApiError(400, "user not found");

    let post;
    try {
        post = await Post.create({ title, desc, author: user, detail });
    } catch (err) {
        if (isDuplicateKeyError(err)) {
            throw new ApiError(409, "A post with that title already exists");
        }
        throw err;
    }
   if (!post) throw new ApiError(400, "post not created");

   setFlash(res, 'success', `"${post.title}" was published.`);
   res.redirect(`/api/v1/blog/show/${post._id}`);
})

const updatePost = asyncHandler(async(req,res) =>{

    const title = trimOrEmpty(req.body.title);
    const desc = trimOrEmpty(req.body.desc);
    const detail = trimOrEmpty(req.body.detail);

    if (!title) throw new ApiError(400, "Title is required");
    if (!desc) throw new ApiError(400, "Description is required");
    if (!detail) throw new ApiError(400, "Details are required");

    const post = await Post.findById(req.params.id)
    if (!post) throw new ApiError(404, "post not found")
    if (post.author.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "you can only update your own posts")
    }

    let updatedPost;
    try {
        updatedPost = await Post.findByIdAndUpdate(req.params.id, { title, desc, detail }, {
            returnDocument: 'after',
            runValidators: true
        });
    } catch (err) {
        if (isDuplicateKeyError(err)) {
            throw new ApiError(409, "A post with that title already exists");
        }
        throw err;
    }

    if (!updatedPost) throw new ApiError(400, "post not found")

    setFlash(res, 'success', 'Post updated.');
    res.redirect(`/api/v1/blog/show/${updatedPost._id}`)
})

const deletePost = asyncHandler(async(req,res) =>{
    const post = await Post.findById(req.params.id)
    if(!post){
        throw new ApiError(404, "Post not found")
    }
    if (post.author.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You can only delete your own posts")
    }
    await Comment.deleteMany({ post: post._id });
    await Post.findByIdAndDelete(req.params.id)
    setFlash(res, 'success', 'Post deleted.');
    res.redirect("/home")
})

const showPost = asyncHandler(async (req, res) => {
    const id = req.params.id;
    const post = await Post.findById(id).populate('author', 'name');
    const currentUser = res.locals.user;
    const comments = await Comment.find({ post: id }).populate('owner', 'name').sort({ createdAt: -1 });

    if (!post) {
        throw new ApiError(404, 'Post not found');
    }
    res.render('show', { title: post.title, isLoggedIn: res.locals.isLoggedIn, post, currentUser, comments });

})

export {
    createpost,
    updatePost,
    deletePost,
    showPost
}
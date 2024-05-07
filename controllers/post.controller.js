import { asyncHandler } from "../utils/asyncHandler.js";
import {Post} from "../models/post.model.js";
import {ApiError} from "../utils/ApiError.js";
import { Comment } from "../models/comment.model.js";
const createpost = asyncHandler(async(req,res) =>{
   
    const {title, desc, detail} = req.body;
   
    if (!title && !desc && !detail) {
        throw new ApiError(400,"title and description required")
    }
    
    const user = req.user._id;
    if (!user) {
        throw new ApiError(400,"user not found")
    }
    const post = await Post.create({
        title,
        desc:desc,
        author: user,
        detail:detail
    })
   if (!post) {
     throw new ApiError(400,"post not created")
   }


   res.redirect("/home")
   res.status(201).json({
        status: "success",
        data: post
    })
})
const updatePost = asyncHandler(async(req,res) =>{
    const {title, desc, detail} = req.body
    const post = await Post.findByIdAndUpdate(req.params.id,{
        title,
        desc,
        detail
    },{
        new: true,
        runValidators: true
    })
    if (!post) {
        throw new ApiError(400,"post not found")
    }
    res.redirect("/home")
})
const showPost = asyncHandler(async (req, res) => {
    const id = req.params.id;
    const post = await Post.findById(id).populate('author', 'name');
    console.log(res.locals)
    const currentUser = res.locals.user;
    const comments = await Comment.find({ post: id }).populate('owner', 'name');

    if (!post) {
        throw new Error('Post not found');
    }
    res.render('show', { isLoggedIn: res.locals.isLoggedIn, post, currentUser, comments });

})
export {
    createpost,
    updatePost,
    showPost
}

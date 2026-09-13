import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import { Comment } from "../models/comment.model.js"
const createComment = asyncHandler(async(req,res) =>{
    const {comment} = req.body
    if(!comment){
        throw new ApiError(400,"comment is required")
    }
    const newComment = await Comment.create({
        content:comment,
        post: req.params.id,
        owner: req.user.id
    })
    res.redirect(`/api/v1/blog/show/${req.params.id}`)
})
const renderEditform = asyncHandler(async(req,res) =>{
    const id = req.params.id
    const comment =  await Comment.findById(id)
    if(!comment){
        throw new ApiError(404,"comment not found")
    }
    if (comment.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "you can only edit your own comments")
    }
    res.render("commentedit",{comment})
})
const editComment = asyncHandler(async(req,res) =>{
    const {comment} = req.body
    if(!comment){
        throw new ApiError(400,"comment is required")
    }
    const commentToEdit = await Comment.findById(req.params.id)
    if(!commentToEdit){
        throw new ApiError(404,"comment not found")
    }
    if (commentToEdit.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "you can only edit your own comments")
    }
    commentToEdit.content = comment
    await commentToEdit.save()
    res.redirect(`/api/v1/blog/show/${commentToEdit.post}`)
})
const deleteComment = asyncHandler(async(req,res) =>{
    const id = req.params.id
    const commentToDelete = await Comment.findById(id)
    if(!commentToDelete){
        throw new ApiError(404,"comment not found")
    }
    if (commentToDelete.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "you can only delete your own comments")
    }
    const postId = commentToDelete.post
    await Comment.findByIdAndDelete(id)
    res.redirect(`/api/v1/blog/show/${postId}`)

})
export{
    createComment,
    editComment,
    deleteComment,
    renderEditform
}